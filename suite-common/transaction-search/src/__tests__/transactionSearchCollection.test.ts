import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { typedObjectEntries } from '@trezor/utils';

import { searchTransactionsFixture } from '../__fixtures__/searchTransactions.fixture';
import stMock from '../__fixtures__/searchTransactions.json';
import { advancedSearchTransactions } from '../advancedSearchTransactions';
import { type SearchAccountLabels, type SearchOutputLabels } from '../searchLabels';
import { createTransactionSearchCollection } from '../transactionSearchCollection';

const toSearchOutputLabels = (
    outputLabels: Record<string, Record<string, string>>,
): SearchOutputLabels =>
    new Map(
        typedObjectEntries(outputLabels).map(([txid, outputs]) => [
            txid,
            new Map(typedObjectEntries(outputs).map(([targetId, label]) => [targetId, label])),
        ]),
    );

const toSearchAccountLabels = (labels: {
    outputLabels: Record<string, Record<string, string>>;
    addressLabels: Record<string, string>;
    accountLabel: string | null;
}): SearchAccountLabels => ({
    ...labels,
    outputLabels: toSearchOutputLabels(labels.outputLabels),
    addressLabels: new Map(Object.entries(labels.addressLabels)),
});

describe('createTransactionSearchCollection', () => {
    const transactions = stMock.transactions as unknown as WalletAccountTransaction[];
    const accountLabels = toSearchAccountLabels(stMock.labels);

    it('matches advancedSearchTransactions for every fixture search', () => {
        const { collection, search } = createTransactionSearchCollection();
        collection.setAll(transactions);

        searchTransactionsFixture.forEach(f => {
            const expected = advancedSearchTransactions(transactions, accountLabels, f.search);
            const actual = search({ accountLabels, search: f.search });

            expect(actual.map(t => t.txid)).toEqual(expected.map(t => t.txid));
        });
    });

    it('keeps a stable result reference when setAll receives shallow-equal data', () => {
        const { collection, search } = createTransactionSearchCollection();
        collection.setAll(transactions);

        const arg = { accountLabels, search: 'a' };
        const first = search(arg);

        // Fresh objects with identical fields — shallow-equal, so every entity is
        // a no-op: the version doesn't bump and the query isn't invalidated.
        collection.setAll(transactions.map(t => ({ ...t })));
        const second = search(arg);

        expect(second).toBe(first);
    });
});
