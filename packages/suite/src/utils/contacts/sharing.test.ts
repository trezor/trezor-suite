import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { type ContactsWalletState } from 'src/reducers/suite/contactsReducer';

import { type Attestation } from './attestation';
import {
    type ReceiveFlowExclusions,
    SHARE_RECLAIM_WINDOW_MS,
    accountShareCapacity,
    getShareableAddresses,
    outstandingSharedAddresses,
    outstandingSharedCountForPeer,
} from './sharing';

const NOW = 1_700_000_000_000;

const shared = (address: string, sharedAt: number, npub = 'npub-hex') => ({
    npub,
    attestation: { address } as Attestation,
    sharedAt,
});

type MockAddress = {
    address: string;
    index: number;
    transfers?: number;
};

const toAccountAddress = ({ address, index, transfers = 0 }: MockAddress) => ({
    path: `m/84'/0'/0'/0/${index}`,
    address,
    transfers,
    balance: '0',
    sent: '0',
    received: '0',
});

// Plain strings are unused addresses at receive indexes 0, 1, 2…
const utxoAccount = (unused: (string | MockAddress)[], used: MockAddress[] = []): Account =>
    mockWalletAccount({
        symbol: 'btc',
        path: "m/84'/0'/0'",
        addresses: {
            used: used.map(toAccountAddress),
            change: [],
            unused: unused.map((entry, index) =>
                toAccountAddress(typeof entry === 'string' ? { address: entry, index } : entry),
            ),
        },
    });

const noExclusions: ReceiveFlowExclusions = {
    touchedAddresses: [],
    labeledUnusedAddresses: [],
    pendingAddresses: [],
};

const receiveInfo = (account: Account, address: string) => {
    const path = account.addresses?.unused.find(unused => unused.address === address)?.path;

    return { path: path ?? '', address };
};

const shareableAddresses = (
    account: Account,
    exclusions: Partial<ReceiveFlowExclusions> = {},
    wallet: Partial<Pick<ContactsWalletState, 'sharedAddresses' | 'spentSharedAddresses'>> = {},
) =>
    getShareableAddresses({ account, wallet, now: NOW, ...noExclusions, ...exclusions }).map(
        ({ address }) => address,
    );

describe('outstandingSharedAddresses', () => {
    it('keeps fresh shares, drops spent and reclaim-expired ones', () => {
        const wallet = {
            sharedAddresses: {
                fresh: shared('fresh', NOW - 1000),
                spent: shared('spent', NOW - 1000),
                expired: shared('expired', NOW - SHARE_RECLAIM_WINDOW_MS - 1),
            },
            spentSharedAddresses: { spent: true },
        };

        expect(outstandingSharedAddresses(wallet, NOW)).toEqual(['fresh']);
    });

    it('returns nothing for an empty wallet', () => {
        expect(outstandingSharedAddresses({}, NOW)).toEqual([]);
    });

    it('treats a share exactly at the reclaim boundary as reclaimed', () => {
        const wallet = { sharedAddresses: { a: shared('a', NOW - SHARE_RECLAIM_WINDOW_MS) } };
        expect(outstandingSharedAddresses(wallet, NOW)).toEqual([]);
    });
});

describe('outstandingSharedCountForPeer', () => {
    it('counts only this peer’s outstanding shares', () => {
        const wallet = {
            sharedAddresses: {
                mine1: shared('mine1', NOW, 'alice'),
                mine2: shared('mine2', NOW, 'alice'),
                theirs: shared('theirs', NOW, 'bob'),
            },
            spentSharedAddresses: {},
        };

        expect(outstandingSharedCountForPeer(wallet, 'alice', NOW)).toBe(2);
        expect(outstandingSharedCountForPeer(wallet, 'bob', NOW)).toBe(1);
    });

    it('excludes spent and reclaim-expired shares (matches the reclaim window)', () => {
        const wallet = {
            sharedAddresses: {
                fresh: shared('fresh', NOW - 1000, 'alice'),
                spent: shared('spent', NOW - 1000, 'alice'),
                expired: shared('expired', NOW - SHARE_RECLAIM_WINDOW_MS - 1, 'alice'),
            },
            spentSharedAddresses: { spent: true },
        };

        expect(outstandingSharedCountForPeer(wallet, 'alice', NOW)).toBe(1);
    });

    it('is 0 for a peer with no shares and for an empty wallet', () => {
        const wallet = { sharedAddresses: { a: shared('a', NOW, 'alice') } };

        expect(outstandingSharedCountForPeer(wallet, 'bob', NOW)).toBe(0);
        expect(outstandingSharedCountForPeer({}, 'alice', NOW)).toBe(0);
    });
});

describe('accountShareCapacity', () => {
    it('is the count of unused addresses not currently shared', () => {
        const account = utxoAccount(['a0', 'a1', 'a2']);
        const wallet = { sharedAddresses: { a0: shared('a0', NOW) }, spentSharedAddresses: {} };

        expect(accountShareCapacity({ account, wallet, now: NOW, ...noExclusions })).toBe(2);
    });

    it('is 0 when every unused address is already outstanding (gap exhausted → block sharing)', () => {
        const account = utxoAccount(['a0', 'a1']);
        const wallet = {
            sharedAddresses: { a0: shared('a0', NOW), a1: shared('a1', NOW) },
            spentSharedAddresses: {},
        };

        expect(accountShareCapacity({ account, wallet, now: NOW, ...noExclusions })).toBe(0);
    });

    it('recovers capacity once a share passes the reclaim window', () => {
        const account = utxoAccount(['a0', 'a1']);
        const wallet = {
            sharedAddresses: {
                // Reclaimed, so a0 is fresh again.
                a0: shared('a0', NOW - SHARE_RECLAIM_WINDOW_MS - 1),
                a1: shared('a1', NOW),
            },
            spentSharedAddresses: {},
        };

        expect(accountShareCapacity({ account, wallet, now: NOW, ...noExclusions })).toBe(1);
    });

    it('frees capacity once a shared address is used on-chain', () => {
        const account = utxoAccount(['a0', 'a1']);
        const wallet = {
            sharedAddresses: { a0: shared('a0', NOW), a1: shared('a1', NOW) },
            spentSharedAddresses: { a0: true },
        };

        expect(accountShareCapacity({ account, wallet, now: NOW, ...noExclusions })).toBe(1);
    });
});

describe('getShareableAddresses', () => {
    it('skips an address revealed or copied on the Receive page and every unused one below it', () => {
        const account = utxoAccount(['a0', 'a1', 'a2', 'a3']);

        expect(
            shareableAddresses(account, { touchedAddresses: [receiveInfo(account, 'a1')] }),
        ).toEqual(['a2', 'a3']);
    });

    it('skips a labeled unused address and every unused one below it', () => {
        const account = utxoAccount(['a0', 'a1', 'a2']);

        expect(
            shareableAddresses(account, { labeledUnusedAddresses: [receiveInfo(account, 'a1')] }),
        ).toEqual(['a2']);
    });

    it('skips an address with a pending transaction and every unused one below it', () => {
        const account = utxoAccount(['a0', 'a1', 'a2']);

        expect(shareableAddresses(account, { pendingAddresses: ['a1'] })).toEqual(['a2']);
    });

    it('skips an unused address with transfers and every unused one below it', () => {
        const account = utxoAccount([
            { address: 'a0', index: 0 },
            { address: 'a1', index: 1, transfers: 1 },
            { address: 'a2', index: 2 },
        ]);

        expect(shareableAddresses(account)).toEqual(['a2']);
    });

    it('skips unused addresses below a used one', () => {
        // A gap: index 1 is unused although index 2 is used.
        const account = utxoAccount(
            [
                { address: 'a1', index: 1 },
                { address: 'a3', index: 3 },
            ],
            [{ address: 'u2', index: 2 }],
        );

        expect(shareableAddresses(account)).toEqual(['a3']);
    });

    it('skips an address another contact holds, but not the addresses below it', () => {
        const account = utxoAccount(['a0', 'a1', 'a2']);
        const wallet = { sharedAddresses: { a1: shared('a1', NOW) }, spentSharedAddresses: {} };

        expect(
            shareableAddresses(account, { touchedAddresses: [receiveInfo(account, 'a1')] }, wallet),
        ).toEqual(['a0', 'a2']);
    });

    it('offers a reclaimed share again although sharing marked it touched', () => {
        const account = utxoAccount(['a0', 'a1']);
        const wallet = {
            sharedAddresses: { a0: shared('a0', NOW - SHARE_RECLAIM_WINDOW_MS - 1) },
            spentSharedAddresses: {},
        };

        expect(
            shareableAddresses(account, { touchedAddresses: [receiveInfo(account, 'a0')] }, wallet),
        ).toEqual(['a0', 'a1']);
    });

    it('offers nothing for an account without discovered addresses', () => {
        const account = mockWalletAccount({ symbol: 'btc', path: "m/84'/0'/0'" });

        expect(shareableAddresses(account)).toEqual([]);
    });
});
