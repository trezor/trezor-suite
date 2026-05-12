import {
    selectAccountTransactionsMarkedAsNotScam,
    selectIsPhishingTransaction,
    selectPhishingTransactionsContext,
} from '../transactionsSelectors';

type AnyState = Parameters<typeof selectPhishingTransactionsContext>[0];
type IsPhishingState = Parameters<typeof selectIsPhishingTransaction>[0];

const createPhishingState = ({
    phishing,
    historic,
    tokenDefinitions,
}: {
    phishing?: { [accountKey: string]: string[] };
    historic?: object;
    tokenDefinitions?: object;
}): AnyState =>
    ({
        wallet: {
            transactions: { phishing: phishing ?? {} },
            fiat: { historic },
        },
        tokenDefinitions: tokenDefinitions ?? {},
    }) as unknown as AnyState;

const createIsPhishingState = ({
    transactions,
    phishing,
    historic,
    tokenDefinitions,
    dustPhishing,
}: {
    transactions?: { [accountKey: string]: Array<{ txid: string; symbol: string }> };
    phishing?: { [accountKey: string]: string[] };
    historic?: object;
    tokenDefinitions?: object;
    dustPhishing?: { isEnabled: boolean; dustThreshold: string };
}): IsPhishingState =>
    ({
        wallet: {
            transactions: {
                transactions: transactions ?? {},
                phishing: phishing ?? {},
            },
            fiat: { historic },
            phishing: {
                dustPhishing: dustPhishing ?? { isEnabled: false, dustThreshold: '0' },
            },
        },
        tokenDefinitions: tokenDefinitions ?? {},
    }) as unknown as IsPhishingState;

describe('selectAccountTransactionsMarkedAsNotScam', () => {
    it('returns a stable empty array reference when no phishing entry exists for the account', () => {
        const stateA = createPhishingState({});
        const stateB = createPhishingState({});

        expect(selectAccountTransactionsMarkedAsNotScam(stateA, 'account-1' as any)).toBe(
            selectAccountTransactionsMarkedAsNotScam(stateB, 'account-1' as any),
        );
    });

    it('returns a stable empty array reference when phishing entry is an empty array', () => {
        const stateA = createPhishingState({ phishing: { 'account-1': [] } });
        const stateB = createPhishingState({ phishing: { 'account-1': [] } });

        expect(selectAccountTransactionsMarkedAsNotScam(stateA, 'account-1' as any)).toBe(
            selectAccountTransactionsMarkedAsNotScam(stateB, 'account-1' as any),
        );
    });

    it('returns the underlying array reference when populated', () => {
        const txids = ['tx1', 'tx2'];
        const state = createPhishingState({ phishing: { 'account-1': txids } });

        expect(selectAccountTransactionsMarkedAsNotScam(state, 'account-1' as any)).toBe(txids);
    });
});

describe('selectPhishingTransactionsContext', () => {
    it('returns a stable object reference across calls when underlying inputs are unchanged', () => {
        const historic = {};
        const tokenDefinitions = { eth: {} };
        const phishing = { 'account-1': ['tx1'] };
        const state = createPhishingState({ phishing, historic, tokenDefinitions });

        const first = selectPhishingTransactionsContext(state, 'account-1' as any, 'eth' as any);
        const second = selectPhishingTransactionsContext(state, 'account-1' as any, 'eth' as any);

        expect(second).toBe(first);
    });

    it('returns a stable object reference when phishing entry is missing (stable empty array path)', () => {
        const historic = {};
        const tokenDefinitions = { eth: {} };
        const stateA = createPhishingState({ historic, tokenDefinitions });
        const stateB = createPhishingState({ historic, tokenDefinitions });

        const first = selectPhishingTransactionsContext(stateA, 'account-1' as any, 'eth' as any);
        const second = selectPhishingTransactionsContext(stateB, 'account-1' as any, 'eth' as any);

        expect(second).toBe(first);
    });

    it('returns a new object reference when the phishing list changes', () => {
        const historic = {};
        const tokenDefinitions = { eth: {} };
        const stateA = createPhishingState({
            phishing: { 'account-1': ['tx1'] },
            historic,
            tokenDefinitions,
        });
        const stateB = createPhishingState({
            phishing: { 'account-1': ['tx1', 'tx2'] },
            historic,
            tokenDefinitions,
        });

        const first = selectPhishingTransactionsContext(stateA, 'account-1' as any, 'eth' as any);
        const second = selectPhishingTransactionsContext(stateB, 'account-1' as any, 'eth' as any);

        expect(second).not.toBe(first);
        expect(second.txsMarkedAsNotScam).toEqual(['tx1', 'tx2']);
    });
});

describe('selectIsPhishingTransaction', () => {
    it('returns the same singleton false result across repeated calls when transaction is missing', () => {
        const state = createIsPhishingState({});

        const first = selectIsPhishingTransaction(state, 'missing-tx' as any, 'account-1' as any);
        const second = selectIsPhishingTransaction(state, 'missing-tx' as any, 'account-1' as any);

        expect(first.isPhishing).toBe(false);
        expect(second).toBe(first);
    });

    it('caches distinct (txid, accountKey) lookups independently and reuses cache per key', () => {
        const state = createIsPhishingState({});

        const tx1First = selectIsPhishingTransaction(state, 'tx1' as any, 'account-1' as any);
        const tx2First = selectIsPhishingTransaction(state, 'tx2' as any, 'account-1' as any);
        const tx1Second = selectIsPhishingTransaction(state, 'tx1' as any, 'account-1' as any);
        const tx2Second = selectIsPhishingTransaction(state, 'tx2' as any, 'account-1' as any);

        // missing transactions all resolve to the false singleton
        expect(tx1First.isPhishing).toBe(false);
        expect(tx2First.isPhishing).toBe(false);
        // subsequent lookups for the same (txid, accountKey) return the same reference
        expect(tx1Second).toBe(tx1First);
        expect(tx2Second).toBe(tx2First);
    });

    it('returns the same result reference for a tx-marked-as-not-scam path across repeated calls', () => {
        // when txid is in txsMarkedAsNotScam, isPhishingTransaction short-circuits to the
        // false singleton without touching transaction.tokens — the simplest non-trivial path
        // that exercises the full memoized chain
        const state = createIsPhishingState({
            transactions: { 'account-1': [{ txid: 'tx1', symbol: 'btc' }] },
            phishing: { 'account-1': ['tx1'] },
        });

        const first = selectIsPhishingTransaction(state, 'tx1' as any, 'account-1' as any);
        const second = selectIsPhishingTransaction(state, 'tx1' as any, 'account-1' as any);

        expect(first.isPhishing).toBe(false);
        expect(second).toBe(first);
    });
});
