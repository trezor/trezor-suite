import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import {
    type RecipientHistory,
    getRecipientHistory,
    getRecipientLastSentTime,
    isNewRecipient,
} from './recipientHistory';

const OWN = '0x1111111111111111111111111111111111111111';
const LEGIT = '0xAbC0000000000000000000000000000000001234';
const POISON = '0xabc9999999999999999999999999999999991234';
const STRANGER = '0x2222222222222222222222222222222222222222';

const getVinVout = (address: string) => ({ addresses: [address], isAddress: true, n: 0 });

type GetTransactionParams = {
    from: string;
    to: string;
    blockTime?: number;
};

const getTransaction = ({ from, to, blockTime }: GetTransactionParams) =>
    testMocks.getWalletTransaction({
        symbol: asNetworkSymbol('eth'),
        txid: `${from}-${to}-${blockTime}`,
        blockTime,
        targets: [],
        details: {
            vin: [getVinVout(from)],
            vout: [getVinVout(to)],
            size: 0,
            totalInput: '0',
            totalOutput: '0',
        },
    });

const getHistory = (transactions: WalletAccountTransaction[]) =>
    getRecipientHistory({ transactions, descriptor: OWN, networkType: 'ethereum' });

const getIsNew = (address: string, history: RecipientHistory) =>
    isNewRecipient({ address, history, networkType: 'ethereum' });

describe(isNewRecipient.name, () => {
    it('does not flag an address the user has paid', () => {
        const history = getHistory([getTransaction({ from: OWN, to: LEGIT })]);

        expect(getIsNew(LEGIT, history)).toBe(false);
    });

    it('flags an address missing from the history', () => {
        const history = getHistory([getTransaction({ from: OWN, to: LEGIT })]);

        expect(getIsNew(STRANGER, history)).toBe(true);
    });

    it('flags an address that only sent the user funds, since a poisoner can do that too', () => {
        const history = getHistory([getTransaction({ from: POISON, to: OWN })]);

        expect(getIsNew(POISON, history)).toBe(true);
    });

    it('flags the recipient of a spoofed transfer out of the user account', () => {
        // Zero-value transferFrom spoofs are listed as sent, but the user never signed them.
        const history = getHistory([getTransaction({ from: STRANGER, to: POISON })]);

        expect(getIsNew(POISON, history)).toBe(true);
    });

    it('ignores the case of EVM addresses', () => {
        const history = getHistory([getTransaction({ from: OWN, to: LEGIT })]);

        expect(getIsNew(LEGIT.toLowerCase(), history)).toBe(false);
    });

    it('does not count the account itself as a paid recipient', () => {
        const history = getHistory([getTransaction({ from: OWN, to: OWN })]);

        expect(history.sentTo.size).toBe(0);
    });
});

describe(getRecipientHistory.name, () => {
    it('trusts the recipient of a token transfer the user sent', () => {
        const transaction = {
            ...getTransaction({ from: OWN, to: STRANGER }),
            tokens: [
                {
                    type: 'sent',
                    standard: 'ERC20',
                    contract: STRANGER,
                    from: OWN,
                    to: LEGIT,
                    decimals: 6,
                    amount: '1',
                },
            ],
        } as WalletAccountTransaction;

        expect(getIsNew(LEGIT, getHistory([transaction]))).toBe(false);
    });

    it('does not trust transfers a signed transaction did not send from the account', () => {
        const transaction = {
            ...getTransaction({ from: OWN, to: STRANGER }),
            tokens: [
                {
                    type: 'recv',
                    standard: 'ERC20',
                    contract: STRANGER,
                    from: STRANGER,
                    to: POISON,
                    decimals: 6,
                    amount: '1',
                },
            ],
            internalTransfers: [{ type: 'external', amount: '1', from: POISON, to: OWN }],
        } as WalletAccountTransaction;

        expect(getIsNew(POISON, getHistory([transaction]))).toBe(true);
    });

    it('matches Tron addresses case-sensitively', () => {
        const tronOwn = 'TOwn000000000000000000000000000000';
        const tronRecipient = 'TAbc000000000000000000000000001234';
        const history = getRecipientHistory({
            transactions: [getTransaction({ from: tronOwn, to: tronRecipient })],
            descriptor: tronOwn,
            networkType: 'tron',
        });

        expect(isNewRecipient({ address: tronRecipient, history, networkType: 'tron' })).toBe(
            false,
        );
        // Tron addresses are base58, so case matters.
        expect(
            isNewRecipient({
                address: tronRecipient.toLowerCase(),
                history,
                networkType: 'tron',
            }),
        ).toBe(true);
    });
});

describe(getRecipientLastSentTime.name, () => {
    const getLastSentTime = (address: string, history: RecipientHistory) =>
        getRecipientLastSentTime({ address, history, networkType: 'ethereum' });

    it('returns the block time of the latest payment to the address, regardless of order', () => {
        const history = getHistory([
            getTransaction({ from: OWN, to: LEGIT, blockTime: 200 }),
            getTransaction({ from: OWN, to: LEGIT, blockTime: 300 }),
            getTransaction({ from: OWN, to: LEGIT, blockTime: 100 }),
        ]);

        expect(getLastSentTime(LEGIT.toLowerCase(), history)).toBe(300);
    });

    it('keeps the latest confirmed time when a newer payment is still pending', () => {
        const history = getHistory([
            getTransaction({ from: OWN, to: LEGIT, blockTime: undefined }),
            getTransaction({ from: OWN, to: LEGIT, blockTime: 100 }),
        ]);

        expect(getLastSentTime(LEGIT, history)).toBe(100);
    });

    it('trusts a recipient whose only payment is pending, without a time', () => {
        const history = getHistory([
            getTransaction({ from: OWN, to: LEGIT, blockTime: undefined }),
        ]);

        expect(getIsNew(LEGIT, history)).toBe(false);
        expect(getLastSentTime(LEGIT, history)).toBeUndefined();
    });

    it.each([
        [
            'only sent funds to the user',
            getTransaction({ from: STRANGER, to: OWN, blockTime: 100 }),
        ],
        [
            'only received a spoofed transfer out of the user account',
            getTransaction({ from: STRANGER, to: POISON, blockTime: 100 }),
        ],
    ])('has no time for an address that %s', (_description, transaction) => {
        const history = getHistory([transaction]);

        expect(getLastSentTime(STRANGER, history)).toBeUndefined();
        expect(getLastSentTime(POISON, history)).toBeUndefined();
    });
});
