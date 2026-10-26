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
    selectActiveDustPhishingThreshold,
    selectHistoricFiatRates,
    selectIsHideSuspiciousTransactions,
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
import { useAccountsTransactions } from './useAccountsTransactions';

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
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = getTxsPerPage(getNetworkType(symbol));
    const anchor = useSelector(selectRouterAnchor);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState(NO_SEARCH_RESULT);
    const isSearching = searchQuery.trim() !== '';

    const {
        transactions: loadedTransactions,
        isComplete,
        isLoading,
    } = useAccountsTransactions({
        accountKeys,
        contractAddress,
        page: currentPage,
        perPage,
        isAllRequested: !!anchor || isSearching,
        isWaitingForAll: isSearching,
    });

    const isHidingSuspicious = useSelector(
        state =>
            hasNetworkPotentialFraudTransactions(symbol) &&
            selectIsHideSuspiciousTransactions(state, symbol),
    );
    const tokenDefinitions = useSelector(state => selectNetworkTokenDefinitions(state, symbol));
    const historicRates = useSelector(selectHistoricFiatRates);
    const txsMarkedAsNotScamByAccount = useSelector(selectPhishingTransactions);
    const dustThreshold = useSelector(selectActiveDustPhishingThreshold);

    const transactions = useMemo(() => {
        if (!isHidingSuspicious) return loadedTransactions;

        return loadedTransactions.filter(transaction => {
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
        loadedTransactions,
        accounts,
        tokenDefinitions,
        historicRates,
        txsMarkedAsNotScamByAccount,
        dustThreshold,
    ]);
    const confirmedTransactions = useMemo(
        () => transactions.filter(transaction => !isPending(transaction)),
        [transactions],
    );

    // A link to one transaction (e.g. from a notification) loads everything and opens its page.
    const anchorPage = useMemo(
        () => (anchor ? findAnchorTransactionPage(confirmedTransactions, perPage, anchor) : null),
        [anchor, confirmedTransactions, perPage],
    );

    useEffect(() => {
        if (anchorPage !== null) {
            setCurrentPage(anchorPage);
        }
    }, [anchorPage]);

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
                              transactions.filter(
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
        [transactions, accounts, accountLabels, searchQuery, isSearching],
    );

    // Until the first results of a search come in, the list stays as it was.
    const searchedTransactions =
        isSearching && searchResult.query !== '' ? searchResult.transactions : transactions;

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
    const totalItems = isSearching
        ? searchedTransactions.length - pendingTxs.length
        : confirmedTransactions.length + (isComplete ? 0 : perPage);

    const onPageSelected = (page: number) => {
        setCurrentPage(page);
        sectionRef.current?.scrollIntoView();
    };

    const getCustomNoTransactions = () => {
        if (transactions.length > 0) return undefined;

        return loadedTransactions.length > 0 ? <NoVisibleTransactions /> : <NoTransactions />;
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
                    isLoading={isLoading}
                    hasNoSearchResults={
                        isSearching && transactions.length > 0 && searchedTransactions.length === 0
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
