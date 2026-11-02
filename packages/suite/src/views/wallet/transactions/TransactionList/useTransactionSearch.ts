import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useDebounce } from 'react-use';

import { advancedSearchTransactions } from '@suite-common/transaction-search';
import { sortByBlockHeightThenTime } from '@suite-common/wallet-core';

import {
    type SelectAccountLabelsForSearchState,
    selectAccountsLabelsForSearch,
} from 'src/selectors/suite/selectAccountLabelsForSearch';
import { type Account, type WalletAccountTransaction } from 'src/types/wallet';

import { findTransactionAccount } from './findTransactionAccount';

const SEARCH_DEBOUNCE_MS = 200;

const NO_SEARCH_RESULT: { query: string; transactions: readonly WalletAccountTransaction[] } = {
    query: '',
    transactions: [],
};

/** What of `transactions` matches `searchQuery`, each account searched with its own labels. */
export const useTransactionSearch = (
    accounts: readonly Account[],
    transactions: readonly WalletAccountTransaction[],
    searchQuery: string,
) => {
    const isSearching = searchQuery.trim() !== '';
    const [searchResult, setSearchResult] = useState(NO_SEARCH_RESULT);
    const accountLabels = useSelector((state: SelectAccountLabelsForSearchState) =>
        selectAccountsLabelsForSearch(state, accounts),
    );

    useDebounce(
        () => {
            if (!isSearching) {
                setSearchResult(NO_SEARCH_RESULT);

                return;
            }

            const results = accounts
                .flatMap((account, index) => {
                    const labels = accountLabels[index];

                    return labels === undefined
                        ? []
                        : advancedSearchTransactions(
                              transactions.filter(
                                  transaction =>
                                      findTransactionAccount([account], transaction) !== undefined,
                              ),
                              labels,
                              searchQuery,
                          );
                })
                .sort(sortByBlockHeightThenTime);

            setSearchResult({ query: searchQuery, transactions: results });
        },
        SEARCH_DEBOUNCE_MS,
        [transactions, accounts, accountLabels, searchQuery, isSearching],
    );

    // Until the first results of a search come in, the list stays as it was.
    return isSearching && searchResult.query !== '' ? searchResult.transactions : transactions;
};
