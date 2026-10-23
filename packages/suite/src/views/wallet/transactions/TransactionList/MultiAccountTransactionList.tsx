import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from 'react-use';

import { Translation } from '@suite/intl';
import { findAnchorTransactionPage, selectRouterAnchor } from '@suite/router';
import { getTxsPerPage } from '@suite-common/suite-utils';
import {
    hasNetworkPotentialFraudTransactions,
    isPhishingTransaction,
    selectNetworkTokenDefinitions,
} from '@suite-common/token-definitions';
import { advancedSearchTransactions } from '@suite-common/transaction-search';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import {
    selectAccountsTransactions,
    selectActiveDustPhishingThreshold,
    selectAreAllAccountTransactionsLoaded,
    selectHistoricFiatRates,
    selectIsHideSuspiciousTransactions,
    selectIsLoadingAccountTransactions,
    selectPhishingTransactions,
} from '@suite-common/wallet-core';
import {
    type Account,
    type TokenAddress,
    type WalletAccountTransaction,
} from '@suite-common/wallet-types';
import { isPending, sortByBlockHeight } from '@suite-common/wallet-utils';
import { Card, Column, Text } from '@trezor/components';

import { DashboardSection } from 'src/components/dashboard';
import { Pagination } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import { selectAccountLabelsForSearch } from 'src/selectors/suite/selectAccountLabelsForSearch';

import { NoVisibleTransactions } from './SingleAccountTransactionList';
import { TransactionListActions } from './TransactionListActions/TransactionListActions';
import { TransactionListBody } from './TransactionListBody';
import { findTransactionAccount } from './findTransactionAccount';
import { useFetchTransactions } from './useFetchTransactions';

const SEARCH_DEBOUNCE_MS = 200;

const NO_TXIDS: string[] = [];

const NO_SEARCH_RESULT: { query: string; transactions: readonly WalletAccountTransaction[] } = {
    query: '',
    transactions: [],
};

const NoTransactions = () => (
    <Card>
        <Column alignItems="center">
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id="TR_NO_TRANSACTIONS_YET" />
            </Text>
        </Column>
    </Card>
);

type MultiAccountTransactionListProps = {
    accounts: readonly Account[];
    symbol: NetworkSymbol;
    contractAddress?: TokenAddress;
};

/** Mount it with a `key` made of the account keys, so its state resets when the accounts change. */
export const MultiAccountTransactionList = ({
    accounts,
    symbol,
    contractAddress,
}: MultiAccountTransactionListProps) => {
    const sectionRef = useRef<HTMLDivElement>(null);

    const accountKeys = useMemo(() => accounts.map(account => account.key), [accounts]);
    const transactions = useSelector(state =>
        selectAccountsTransactions(state, accountKeys, contractAddress),
    );
    const isLoadingAny = useSelector(state =>
        accountKeys.some(accountKey => selectIsLoadingAccountTransactions(state, accountKey)),
    );
    const areAllLoaded = useSelector(state =>
        accountKeys.every(accountKey => selectAreAllAccountTransactionsLoaded(state, accountKey)),
    );
    const { fetchNext, fetchAll, fetchedAll, hasMore, isFetching } = useFetchTransactions(accounts);

    const isHidingSuspicious = useSelector(
        state =>
            hasNetworkPotentialFraudTransactions(symbol) &&
            selectIsHideSuspiciousTransactions(state, symbol),
    );
    const tokenDefinitions = useSelector(state => selectNetworkTokenDefinitions(state, symbol));
    const historicRates = useSelector(selectHistoricFiatRates);
    const txsMarkedAsNotScamByAccount = useSelector(selectPhishingTransactions);
    const dustThreshold = useSelector(selectActiveDustPhishingThreshold);

    const visibleTransactions = useMemo(() => {
        if (!isHidingSuspicious) {
            return transactions;
        }

        return transactions.filter(transaction => {
            const account = findTransactionAccount(accounts, transaction);

            return !isPhishingTransaction({
                transaction,
                tokenDefinitions,
                historicRates,
                txsMarkedAsNotScam:
                    (account && txsMarkedAsNotScamByAccount[account.key]) ?? NO_TXIDS,
                dustThreshold,
            }).isPhishing;
        });
    }, [
        isHidingSuspicious,
        transactions,
        accounts,
        tokenDefinitions,
        historicRates,
        txsMarkedAsNotScamByAccount,
        dustThreshold,
    ]);

    const [currentPage, setCurrentPage] = useState(1);
    const perPage = getTxsPerPage(getNetworkType(symbol));
    const confirmedTransactions = useMemo(
        () => visibleTransactions.filter(transaction => !isPending(transaction)),
        [visibleTransactions],
    );
    const confirmedCount = confirmedTransactions.length;

    // A link to one transaction (e.g. from a notification) loads everything and opens its page.
    const anchor = useSelector(selectRouterAnchor);
    const anchorPage = useMemo(
        () => (anchor ? findAnchorTransactionPage(confirmedTransactions, perPage, anchor) : null),
        [anchor, confirmedTransactions, perPage],
    );

    useEffect(() => {
        if (anchor && !fetchedAll) {
            fetchAll();
        }
    }, [anchor, fetchedAll, fetchAll]);

    useEffect(() => {
        if (anchorPage !== null) {
            setCurrentPage(anchorPage);
        }
    }, [anchorPage]);

    // Until the page is full: for a coin that is one page of every account, a token's transfers
    // may be spread over many account pages.
    useEffect(() => {
        if (!isFetching && hasMore && confirmedCount < currentPage * perPage) {
            fetchNext();
        }
    }, [fetchNext, isFetching, hasMore, confirmedCount, currentPage, perPage]);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState(NO_SEARCH_RESULT);
    const isSearching = searchQuery.trim() !== '';
    const accountLabels = useSelector(state =>
        accounts.map(account => selectAccountLabelsForSearch(state, account)),
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
                              visibleTransactions.filter(
                                  transaction =>
                                      findTransactionAccount([account], transaction) !== undefined,
                              ),
                              labels,
                              searchQuery,
                          );
                })
                .sort(sortByBlockHeight);

            setSearchResult({ query: searchQuery, transactions: results });
        },
        SEARCH_DEBOUNCE_MS,
        [visibleTransactions, accounts, accountLabels, searchQuery, isSearching],
    );

    // Until the first results of a search come in, the list stays as it was.
    const searchedTransactions =
        isSearching && searchResult.query !== '' ? searchResult.transactions : visibleTransactions;

    const pendingTxs = useMemo(
        () => searchedTransactions.filter(isPending),
        [searchedTransactions],
    );
    const confirmedTxs = useMemo(
        () =>
            searchedTransactions
                .filter(transaction => !isPending(transaction))
                .slice((currentPage - 1) * perPage, currentPage * perPage),
        [searchedTransactions, currentPage, perPage],
    );
    // Pages are counted as they load: XRP and Stellar have no total, and a token's transfers or the
    // suspicious filter make any total too high.
    const totalItems = isSearching
        ? searchedTransactions.length - pendingTxs.length
        : confirmedCount + (hasMore ? perPage : 0);

    const onPageSelected = (page: number) => {
        setCurrentPage(page);
        sectionRef.current?.scrollIntoView();
    };

    const getCustomNoTransactions = () => {
        if (transactions.length === 0) {
            return <NoTransactions />;
        }

        return visibleTransactions.length === 0 ? <NoVisibleTransactions /> : undefined;
    };

    return (
        <DashboardSection
            ref={sectionRef}
            heading={<Translation id="TR_ALL_TRANSACTIONS" />}
            actions={
                <TransactionListActions
                    accounts={accounts}
                    symbol={symbol}
                    searchQuery={searchQuery}
                    setSearch={setSearchQuery}
                    setSelectedPage={setCurrentPage}
                    isExportable={false}
                />
            }
            data-testid="@transactions/multi-account"
        >
            <Column gap={32} padding={{ top: 16 }}>
                <TransactionListBody
                    isLoading={
                        ((isLoadingAny || isFetching) && confirmedTxs.length === 0) ||
                        (isSearching && !areAllLoaded && searchedTransactions.length === 0)
                    }
                    hasNoSearchResults={
                        isSearching &&
                        visibleTransactions.length > 0 &&
                        searchedTransactions.length === 0
                    }
                    pendingTxs={pendingTxs}
                    confirmedTxs={confirmedTxs}
                    accounts={accounts}
                    symbol={symbol}
                    customNoTransactions={getCustomNoTransactions()}
                    isAccountShown
                />
                {totalItems > perPage && (
                    <Pagination
                        currentPage={currentPage}
                        perPage={perPage}
                        totalItems={totalItems}
                        onPageSelected={onPageSelected}
                        explicitNavigation
                    />
                )}
            </Column>
        </DashboardSection>
    );
};
