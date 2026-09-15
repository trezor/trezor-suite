import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { typedObjectEntries } from '@trezor/utils';

import { searchTransactionsFixture } from './__fixtures__/searchTransactions.fixture';
import stMock from './__fixtures__/searchTransactions.json';
import { advancedSearchTransactions } from './advancedSearchTransactions';
import { type SearchAccountLabels, type SearchOutputLabels } from './searchLabels';

// Original Fixtures were create with legacy metadata structure,
// so we need to transform them to fit the new SearchAccountLabels structure used in the tests
const toSearchOutputLabels = (
    outputLabels: Record<string, Record<string, string>>,
): SearchOutputLabels =>
    new Map(
        typedObjectEntries(outputLabels).map(([txid, outputs]) => [
            txid,
            new Map(typedObjectEntries(outputs).map(([targetId, label]) => [targetId, label])),
        ]),
    );

// Original Fixtures were create with legacy metadata structure,
// so we need to transform them to fit the new SearchAccountLabels structure used in the tests
const toSearchAccountLabels = (labels: {
    outputLabels: Record<string, Record<string, string>>;
    addressLabels: Record<string, string>;
    accountLabel: string | null;
}): SearchAccountLabels => ({
    ...labels,
    outputLabels: toSearchOutputLabels(labels.outputLabels),
    addressLabels: new Map(Object.entries(labels.addressLabels)),
});

describe(advancedSearchTransactions.name, () => {
    const transactions = stMock.transactions as unknown as WalletAccountTransaction[];
    const accountLabels = toSearchAccountLabels(stMock.labels);

    searchTransactionsFixture.forEach(f => {
        it(f.description, () => {
            const search = advancedSearchTransactions(transactions, accountLabels, f.search);

            if (f.result) {
                // expect(search.length).toBe(f.result.length);
                search.forEach((t, i) => {
                    expect(t.txid).toBe(f.result[i]);
                });
            }

            if (f.notResult) {
                search.forEach((t, i) => {
                    expect(t.txid).not.toBe(f.notResult[i]);
                });
            }
        });
    });
});

describe('the order an advanced search hands transactions back in', () => {
    // The list paginates by index and renders by date, so a result in the order the search terms
    // happened to match in would shuffle the pages. Worth pinning: the resolution from txids back
    // to transactions is a lookup now, and a lookup has no order of its own.
    const mockTransaction = (txid: string, address: string): WalletAccountTransaction =>
        ({
            txid,
            symbol: 'btc',
            tokens: [],
            targets: [{ addresses: [address] }],
            details: { vin: [], vout: [{ addresses: [address] }] },
        }) as unknown as WalletAccountTransaction;

    const noLabels: SearchAccountLabels = {
        accountLabel: null,
        outputLabels: new Map(),
        addressLabels: new Map(),
    };

    const first = mockTransaction('tx1', 'bc1qfirst');
    const second = mockTransaction('tx2', 'bc1qsecond');
    const third = mockTransaction('tx3', 'bc1qthird');
    const ordered = [first, second, third];

    it('keeps the array’s order when the terms matched in another', () => {
        expect(advancedSearchTransactions(ordered, noLabels, 'bc1qthird|bc1qfirst')).toEqual([
            first,
            third,
        ]);
    });

    it('keeps the array’s order for an AND query', () => {
        expect(advancedSearchTransactions(ordered, noLabels, 'bc1q|second')).toEqual([
            first,
            second,
            third,
        ]);
    });

    it('returns only what every AND term matched', () => {
        expect(advancedSearchTransactions(ordered, noLabels, 'bc1q&second')).toEqual([second]);
    });

    it('leaves out the holes a not-yet-fetched page left', () => {
        const sparse: WalletAccountTransaction[] = [];
        sparse[0] = first;
        sparse[3] = third;

        expect(advancedSearchTransactions(sparse, noLabels, 'bc1qthird|bc1qfirst')).toEqual([
            first,
            third,
        ]);
    });
});
