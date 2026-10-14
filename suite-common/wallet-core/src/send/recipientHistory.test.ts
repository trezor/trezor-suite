import { testMocks } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';

import {
    type RecipientHistory,
    getRecipientHistory,
    getRecipientLastSentTime,
    getRecipientRisk,
} from './recipientHistory';

const OWN = '0x1111111111111111111111111111111111111111';
// L is an address the user paid, P a poisoner's vanity address sharing its first 3 and last 4 hex.
const LEGIT = '0xAbC0000000000000000000000000000000001234';
const POISON = '0xabc9999999999999999999999999999999991234';
const STRANGER = '0x2222222222222222222222222222222222222222';

const getVinVout = (address: string) => ({ addresses: [address], isAddress: true, n: 0 });

const getTransaction = ({
    from,
    to,
    isPhishing = false,
    blockTime,
}: {
    from: string;
    to: string;
    isPhishing?: boolean;
    blockTime?: number;
}) =>
    testMocks.getWalletTransaction({
        symbol: asNetworkSymbol('eth'),
        txid: isPhishing ? `phishing-${from}-${to}-${blockTime}` : `${from}-${to}-${blockTime}`,
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
    getRecipientHistory({
        transactions,
        descriptor: OWN,
        networkType: 'ethereum',
        isPhishing: transaction => transaction.txid.startsWith('phishing-'),
    });

const getRisk = (address: string, history: RecipientHistory) =>
    getRecipientRisk({ address, history, networkType: 'ethereum' });

describe('lookalike matching', () => {
    const history = getHistory([getTransaction({ from: LEGIT, to: OWN })]);

    it('matches a different EVM address sharing the first 3 and last 4 hex, ignoring case', () => {
        expect(getRisk(POISON, history)).toBe('poisoning');
    });

    it('does not match the same address', () => {
        expect(getRisk(LEGIT.toLowerCase(), history)).toBeUndefined();
    });

    it.each([
        ['only the first 2 hex match', '0xab09999999999999999999999999999999991234'],
        ['only the last 3 hex match', '0xabc9999999999999999999999999999999990234'],
    ])('does not match when %s', (_description, address) => {
        expect(getRisk(address, history)).toBe('new');
    });

    it('does not count the fixed leading T of Tron addresses', () => {
        const tronOwn = 'TOwn000000000000000000000000000000';
        const getTronRisk = (address: string, counterparty: string) =>
            getRecipientRisk({
                address,
                history: getRecipientHistory({
                    transactions: [getTransaction({ from: counterparty, to: tronOwn })],
                    descriptor: tronOwn,
                    networkType: 'tron',
                    isPhishing: () => false,
                }),
                networkType: 'tron',
            });

        expect(
            getTronRisk('TAb9999999999999999999999999991234', 'TAb0000000000000000000000000001234'),
        ).toBe('new');
        expect(
            getTronRisk('TAbc999999999999999999999999991234', 'TAbc000000000000000000000000001234'),
        ).toBe('poisoning');
    });
});

describe('getRecipientRisk', () => {
    it('does not warn about an address the user has paid, even with a lookalike in the history', () => {
        const history = getHistory([
            getTransaction({ from: OWN, to: LEGIT }),
            getTransaction({ from: POISON, to: OWN, isPhishing: true }),
        ]);

        expect(getRisk(LEGIT, history)).toBeUndefined();
    });

    it('warns about poisoning when the address looks like one the user has paid', () => {
        const history = getHistory([getTransaction({ from: OWN, to: LEGIT })]);

        expect(getRisk(POISON, history)).toBe('poisoning');
    });

    it('warns about poisoning when a lookalike sent the user funds, so it is not trusted', () => {
        const history = getHistory([
            getTransaction({ from: LEGIT, to: OWN }),
            getTransaction({ from: POISON, to: OWN }),
        ]);

        expect(getRisk(POISON, history)).toBe('poisoning');
    });

    it('warns about poisoning when the address only appears in phishing transactions', () => {
        const history = getHistory([
            getTransaction({ from: OWN, to: LEGIT }),
            getTransaction({ from: STRANGER, to: OWN, isPhishing: true }),
        ]);

        expect(getRisk(STRANGER, history)).toBe('poisoning');
    });

    it('does not trust the recipient of a spoofed transfer out of the user account', () => {
        // Zero-value transferFrom spoofs are listed as sent, but the user never signed them.
        const history = getHistory([
            getTransaction({ from: STRANGER, to: POISON }),
            getTransaction({ from: OWN, to: LEGIT }),
        ]);

        expect(getRisk(POISON, history)).toBe('poisoning');
    });

    it('does not warn about an address that sent the user funds', () => {
        const history = getHistory([getTransaction({ from: STRANGER, to: OWN })]);

        expect(getRisk(STRANGER, history)).toBeUndefined();
    });

    it('flags an address missing from the history as new', () => {
        const history = getHistory([getTransaction({ from: OWN, to: LEGIT })]);

        expect(getRisk(STRANGER, history)).toBe('new');
    });

    it('does not flag anything while the account history is not loaded', () => {
        expect(getRisk(STRANGER, getHistory([]))).toBeUndefined();
    });

    it('ignores the case of EVM addresses', () => {
        const history = getHistory([getTransaction({ from: OWN, to: LEGIT })]);

        expect(getRisk(LEGIT.toLowerCase(), history)).toBeUndefined();
    });
});

describe('getRecipientHistory', () => {
    it('collects counterparties of token transfers', () => {
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

        expect(getRisk(LEGIT, getHistory([transaction]))).toBeUndefined();
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
        const history = getHistory([getTransaction({ from: OWN, to: LEGIT }), transaction]);

        expect(getRisk(POISON, history)).toBe('poisoning');
    });
});

describe('getRecipientLastSentTime', () => {
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

        expect(history.sentTo.has(LEGIT.toLowerCase())).toBe(true);
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
