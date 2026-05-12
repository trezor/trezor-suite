import {
    selectAccountTransactionsMarkedAsNotScam,
    selectPhishingTransactionsContext,
} from '../transactionsSelectors';

type AnyState = Parameters<typeof selectPhishingTransactionsContext>[0];

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
