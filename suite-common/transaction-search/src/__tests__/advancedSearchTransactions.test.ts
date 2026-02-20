import { WalletAccountTransaction } from '@suite-common/wallet-types';

import { searchTransactionsFixture } from '../__fixtures__/searchTransactions.fixture';
import stMock from '../__fixtures__/searchTransactions.json';
import { advancedSearchTransactions } from '../advancedSearchTransactions';

describe(advancedSearchTransactions.name, () => {
    const transactions = stMock.transactions as unknown as WalletAccountTransaction[];
    const metadata = stMock.labels;

    searchTransactionsFixture.forEach(f => {
        it(f.description, () => {
            const search = advancedSearchTransactions(transactions, metadata, f.search);

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
