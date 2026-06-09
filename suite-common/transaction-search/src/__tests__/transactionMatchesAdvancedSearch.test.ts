import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { typedObjectEntries } from '@trezor/utils';

import { searchTransactionsFixture } from '../__fixtures__/searchTransactions.fixture';
import stMock from '../__fixtures__/searchTransactions.json';
import {
    advancedSearchTransactions,
    transactionMatchesAdvancedSearch,
} from '../advancedSearchTransactions';
import { type SearchAccountLabels, type SearchOutputLabels } from '../searchLabels';

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

describe('transactionMatchesAdvancedSearch parity', () => {
    const transactions = stMock.transactions as unknown as WalletAccountTransaction[];
    const accountLabels = toSearchAccountLabels(stMock.labels);

    // The per-transaction predicate must produce exactly the same result set as
    // the list-based advancedSearchTransactions for every fixture search.
    searchTransactionsFixture.forEach(f => {
        it(f.description, () => {
            const expected = advancedSearchTransactions(transactions, accountLabels, f.search);
            const actual = transactions.filter(t =>
                transactionMatchesAdvancedSearch(t, accountLabels, f.search),
            );

            expect(actual.map(t => t.txid)).toEqual(expected.map(t => t.txid));
        });
    });
});
