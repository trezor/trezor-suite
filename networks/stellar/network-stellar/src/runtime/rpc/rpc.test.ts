import { xdr } from '@stellar/stellar-sdk';

import {
    STELLAR_BASE_RESERVE,
    STELLAR_RPC_MAX_LEDGER_KEYS,
    STELLAR_RPC_SUBMIT_POLL_INTERVAL_MS,
    STELLAR_RPC_SUBMIT_POLL_TIMEOUT_MS,
    STELLAR_RPC_SUBMIT_RETRY_DELAY_MS,
} from '../../constants';
import * as fixtures from './__fixtures__/rpc.fixture';
import { readAccountState } from './account';
import { decodeAccountEntry, decodeLedgerHeader, decodeTrustlineEntry } from './decode';
import { readInclusionFee } from './fees';
import { readLatestLedger } from './ledger';
import { buildAccountKey, buildTrustlineKey } from './ledgerKeys';
import { readNetwork, readVersion } from './network';
import { submitTransaction } from './submit';
import type { StellarTransaction } from '../../types';
import type { StellarRpcServer } from '../../types/rpc';

const toEntryData = (base64: string) => xdr.LedgerEntryData.fromXDR(base64, 'base64');

const asServer = (stub: Partial<StellarRpcServer>) => stub as StellarRpcServer;

describe('rpc/decode', () => {
    describe('decodeAccountEntry', () => {
        fixtures.decodeAccountEntry.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                expect(decodeAccountEntry(toEntryData(input))).toEqual(expectedOutput);
            });
        });
    });

    describe('decodeTrustlineEntry', () => {
        fixtures.decodeTrustlineEntry.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                expect(decodeTrustlineEntry(toEntryData(input))).toEqual(expectedOutput);
            });
        });
    });

    describe('decodeLedgerHeader', () => {
        it('reads the base reserve, base fee and protocol version', () => {
            expect(decodeLedgerHeader(fixtures.LEDGER_HEADER)).toEqual({
                baseReserve: '5000000',
                baseFee: '100',
                ledgerVersion: 23,
            });
        });
    });
});

describe('rpc/ledgerKeys', () => {
    it('builds an account key that round-trips through XDR', () => {
        const key = buildAccountKey(fixtures.HOLDER);

        expect(key.switch().name).toBe('account');
        expect(xdr.LedgerKey.fromXDR(key.toXDR('base64'), 'base64').toXDR('base64')).toBe(
            key.toXDR('base64'),
        );
    });

    it('builds a trustline key matching the recorded entry', () => {
        const key = buildTrustlineKey(fixtures.HOLDER, 'USDC', fixtures.ISSUER);
        const entry = toEntryData(fixtures.TRUSTLINE_ALPHANUM4).trustLine();

        expect(key.switch().name).toBe('trustline');
        expect(key.trustLine().asset().toXDR('base64')).toBe(entry.asset().toXDR('base64'));
        expect(key.trustLine().accountId().toXDR('base64')).toBe(entry.accountId().toXDR('base64'));
    });
});

describe('rpc/ledger', () => {
    const rawLedger = {
        id: 'ledgerhash',
        sequence: 59_100_123,
        protocolVersion: '23',
        closeTime: '1756900000',
        metadataXdr: '',
    };

    it('reads the head and the base reserve from one call', async () => {
        const server = asServer({
            _getLatestLedger: () =>
                Promise.resolve({ ...rawLedger, headerXdr: fixtures.LEDGER_HEADER }),
        });

        await expect(readLatestLedger(server)).resolves.toEqual({
            sequence: 59_100_123,
            hash: 'ledgerhash',
            baseReserve: '5000000',
            protocolVersion: 23,
        });
    });

    it('falls back to the protocol base reserve when the node omits the header', async () => {
        const server = asServer({
            _getLatestLedger: () => Promise.resolve({ ...rawLedger, headerXdr: '' }),
        });

        await expect(readLatestLedger(server)).resolves.toMatchObject({
            baseReserve: STELLAR_BASE_RESERVE,
            sequence: 59_100_123,
        });
    });

    it('falls back to the protocol base reserve when the header cannot be decoded', async () => {
        const server = asServer({
            _getLatestLedger: () => Promise.resolve({ ...rawLedger, headerXdr: 'not-xdr' }),
        });

        await expect(readLatestLedger(server)).resolves.toMatchObject({
            baseReserve: STELLAR_BASE_RESERVE,
        });
    });
});

describe('rpc/fees', () => {
    it('uses the p70 inclusion fee', async () => {
        const server = asServer({
            getFeeStats: () =>
                Promise.resolve({ inclusionFee: { p70: '100' } } as Awaited<
                    ReturnType<StellarRpcServer['getFeeStats']>
                >),
        });

        await expect(readInclusionFee(server)).resolves.toBe('100');
    });
});

describe('rpc/network', () => {
    it('detects testnet from the network passphrase', async () => {
        const testnet = asServer({
            getNetwork: () =>
                Promise.resolve({
                    passphrase: 'Test SDF Network ; September 2015',
                    protocolVersion: '23',
                }),
        });
        const mainnet = asServer({
            getNetwork: () =>
                Promise.resolve({
                    passphrase: 'Public Global Stellar Network ; September 2015',
                    protocolVersion: '23',
                }),
        });

        await expect(readNetwork(testnet)).resolves.toMatchObject({ isTestnet: true });
        await expect(readNetwork(mainnet)).resolves.toMatchObject({ isTestnet: false });
    });

    it('reads the node version', async () => {
        const server = asServer({
            getVersionInfo: () =>
                Promise.resolve({ version: '28.0.1' } as Awaited<
                    ReturnType<StellarRpcServer['getVersionInfo']>
                >),
        });

        await expect(readVersion(server)).resolves.toBe('28.0.1');
    });
});

describe('rpc/account', () => {
    const entriesOf = (...base64: string[]) => ({
        entries: base64.map(value => ({
            key: xdr.LedgerKey.fromXDR(fixtures.ACCOUNT_KEY, 'base64'),
            val: toEntryData(value),
        })),
        latestLedger: 1,
    });

    it('reports a missing account entry as a non-existent account', async () => {
        const server = asServer({ getLedgerEntries: () => Promise.resolve(entriesOf()) });

        await expect(
            readAccountState({ server, descriptor: fixtures.HOLDER, assets: [] }),
        ).resolves.toMatchObject({ exists: false, balance: '0', trustlines: [] });
    });

    it('reads the account entry and its trustlines as stroops', async () => {
        const server = asServer({
            getLedgerEntries: () =>
                Promise.resolve(
                    entriesOf(
                        fixtures.ACCOUNT_WITH_LIABILITIES_AND_SPONSORSHIP,
                        fixtures.TRUSTLINE_ALPHANUM4,
                    ),
                ),
        });

        await expect(
            readAccountState({
                server,
                descriptor: fixtures.HOLDER,
                assets: [{ assetCode: 'USDC', assetIssuer: fixtures.ISSUER }],
            }),
        ).resolves.toEqual({
            exists: true,
            balance: '1234567890',
            sequence: '245550284914819073',
            numSubEntries: 6,
            numSponsoring: 3,
            numSponsored: 2,
            sellingLiabilities: '7500000',
            trustlines: [{ assetCode: 'USDC', assetIssuer: fixtures.ISSUER, balance: '45000000' }],
        });
    });

    it('splits the keys into batches the node accepts', async () => {
        const batches: number[] = [];
        const server = asServer({
            getLedgerEntries: (...keys) => {
                batches.push(keys.length);

                return Promise.resolve(entriesOf(fixtures.ACCOUNT_WITHOUT_EXTENSIONS));
            },
        });
        // One account key plus one trustline key per asset.
        const assets = Array.from({ length: STELLAR_RPC_MAX_LEDGER_KEYS + 9 }, () => ({
            assetCode: 'USDC',
            assetIssuer: fixtures.ISSUER,
        }));

        await readAccountState({ server, descriptor: fixtures.HOLDER, assets });

        expect(batches).toEqual([STELLAR_RPC_MAX_LEDGER_KEYS, 10]);
    });
});

describe('rpc/submit', () => {
    const transaction = {} as StellarTransaction;
    const HASH = 'abc123';
    const failedResult = xdr.TransactionResult.fromXDR(
        fixtures.TRANSACTION_RESULT_PAYMENT_SRC_NO_TRUST,
        'base64',
    );
    const sent = (status: string, extra: Record<string, unknown> = {}) =>
        ({ status, hash: HASH, latestLedger: 1, latestLedgerCloseTime: 1, ...extra }) as Awaited<
            ReturnType<StellarRpcServer['sendTransaction']>
        >;
    const got = (status: string, extra: Record<string, unknown> = {}) =>
        ({ status, txHash: HASH, ...extra }) as Awaited<
            ReturnType<StellarRpcServer['getTransaction']>
        >;

    it('reports a rejected submission with its decoded result codes', async () => {
        const server = asServer({
            sendTransaction: () => Promise.resolve(sent('ERROR', { errorResult: failedResult })),
        });

        await expect(submitTransaction({ server, transaction })).rejects.toThrow(
            'transaction result code: txFailed, operation result code: paymentSrcNoTrust',
        );
    });

    it('reports an apply-time failure the same way a blocking submit did', async () => {
        const server = asServer({
            sendTransaction: () => Promise.resolve(sent('PENDING')),
            getTransaction: () => Promise.resolve(got('FAILED', { resultXdr: failedResult })),
        });

        await expect(submitTransaction({ server, transaction })).rejects.toThrow(
            'transaction result code: txFailed, operation result code: paymentSrcNoTrust',
        );
    });

    it('resolves with the hash once the transaction is applied', async () => {
        const server = asServer({
            sendTransaction: () => Promise.resolve(sent('PENDING')),
            getTransaction: () => Promise.resolve(got('SUCCESS')),
        });

        await expect(submitTransaction({ server, transaction })).resolves.toBe(HASH);
    });

    it('polls a pending transaction until it lands', async () => {
        jest.useFakeTimers();
        const getTransaction = jest
            .fn()
            .mockResolvedValueOnce(got('NOT_FOUND'))
            .mockResolvedValueOnce(got('SUCCESS'));
        const server = asServer({
            sendTransaction: () => Promise.resolve(sent('PENDING')),
            getTransaction,
        });

        const submitted = submitTransaction({ server, transaction });
        await jest.advanceTimersByTimeAsync(STELLAR_RPC_SUBMIT_POLL_INTERVAL_MS);

        await expect(submitted).resolves.toBe(HASH);
        expect(getTransaction).toHaveBeenCalledTimes(2);
        jest.useRealTimers();
    });

    it('retries a congested node before giving up on the send', async () => {
        jest.useFakeTimers();
        const sendTransaction = jest
            .fn()
            .mockResolvedValueOnce(sent('TRY_AGAIN_LATER'))
            .mockResolvedValueOnce(sent('DUPLICATE'));
        const server = asServer({
            sendTransaction,
            getTransaction: () => Promise.resolve(got('SUCCESS')),
        });

        const submitted = submitTransaction({ server, transaction });
        await jest.advanceTimersByTimeAsync(STELLAR_RPC_SUBMIT_RETRY_DELAY_MS);

        await expect(submitted).resolves.toBe(HASH);
        expect(sendTransaction).toHaveBeenCalledTimes(2);
        jest.useRealTimers();
    });

    it('returns the hash when the transaction has not landed within the budget', async () => {
        jest.useFakeTimers();
        const server = asServer({
            sendTransaction: () => Promise.resolve(sent('PENDING')),
            getTransaction: () => Promise.resolve(got('NOT_FOUND')),
        });

        const submitted = submitTransaction({ server, transaction });
        await jest.advanceTimersByTimeAsync(STELLAR_RPC_SUBMIT_POLL_TIMEOUT_MS * 2);

        await expect(submitted).resolves.toBe(HASH);
        jest.useRealTimers();
    });
});
