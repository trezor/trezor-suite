import { WalletAccountTransaction } from '@suite-common/wallet-types';
import { typedObjectEntries } from '@trezor/utils';

import { searchTransactionsFixture } from '../__fixtures__/searchTransactions.fixture';
import stMock from '../__fixtures__/searchTransactions.json';
import { advancedSearchTransactions } from '../advancedSearchTransactions';
import { SearchAccountLabels, SearchOutputLabels } from '../searchLabels';

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
    accountLabel?: string;
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
