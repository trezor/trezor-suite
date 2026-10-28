import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { findAnchorTransactionPage, selectRouterAnchor } from '@suite/router';
import { getTxsPerPage } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { fetchAllTransactionsForAccountThunk } from '@suite-common/wallet-core';
import { isPending } from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { DashboardSection } from 'src/components/dashboard';
import { Pagination } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import { type Account, type WalletAccountTransaction } from 'src/types/wallet';

import { LoadOlderHistory } from './LoadOlderHistory';
import { TransactionListActions } from './TransactionListActions/TransactionListActions';
import { TransactionListBody } from './TransactionListBody';
import { useFetchTransactions } from './useFetchTransactions';
import { useTransactionSearch } from './useTransactionSearch';

interface TransactionListProps {
    allTransactions: WalletAccountTransaction[];
    areAllTransactionsLoaded: boolean;
    transactions: WalletAccountTransaction[];
    symbol: WalletAccountTransaction['symbol'];
    isLoading?: boolean;
    account: Account;
    customTotalItems?: number;
    customHeading?: ReactElement;
    isExportable?: boolean;
    isTxFilteringEnabled?: boolean;
}

export const TransactionList = ({
    allTransactions,
    areAllTransactionsLoaded,
    transactions,
    isLoading,
    account,
    symbol,
    customHeading,
    customTotalItems,
    isExportable = true,
    isTxFilteringEnabled = true,
}: TransactionListProps) => {
    const anchor = useSelector(selectRouterAnchor);
    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();

    const accounts = useMemo(() => [account], [account]);
    const { fetchPage, fetchedAll, fetchAll } = useFetchTransactions(account, allTransactions);

    const [searchQuery, setSearchQuery] = useState('');
    const isSearching = searchQuery.trim() !== '';
    const searchedTransactions = useTransactionSearch(accounts, transactions, searchQuery);
    const hasSearchLoadStartedRef = useRef(false);

    const sectionRef = useRef<HTMLDivElement>(null);

    // A search needs the whole history. This list loads it itself rather than rely on whoever
    // renders it to have done so.
    const search = (query: string) => {
        setSearchQuery(query);

        if (query.trim() === '' || hasSearchLoadStartedRef.current) return;

        hasSearchLoadStartedRef.current = true;
        dispatch(fetchAllTransactionsForAccountThunk({ accountKey: account.key, noLoading: true }))
            .unwrap()
            .catch(() => {
                hasSearchLoadStartedRef.current = false;
                dispatch(
                    notificationsActions.addToast({
                        type: 'error',
                        error: translationString('TR_SEARCH_FAIL'),
                    }),
                );
            });
    };

    useEffect(() => {
        if (anchor && !fetchedAll) {
            fetchAll();
        }
    }, [anchor, account, dispatch, fetchedAll, fetchAll]);

    // Pagination
    const perPage = getTxsPerPage(account.networkType);
    // NOTE: if there is no anchor, we can keep the page 1
    const startPage = useMemo(
        () => (anchor ? findAnchorTransactionPage(transactions, perPage, anchor) : null),
        [anchor, perPage, transactions],
    );
    const [currentPage, setSelectedPage] = useState(startPage ?? 1);

    useEffect(() => {
        // reset page on account change
        if (startPage === null) return;
        setSelectedPage(startPage);
    }, [account.descriptor, account.symbol, startPage]);

    // Pending txs are not part of the paginated history yet and keep their own chronological order, so
    // they are rendered above the list on every page.
    const pendingTxs = useMemo(
        () => searchedTransactions.filter(isPending),
        [searchedTransactions],
    );

    const defaultTotalItems = customTotalItems ?? account.history.total;
    // account.history.total counts confirmed txs only, but pending txs occupy slots in the sliced
    // array, so include them in the page count to keep the last confirmed tx reachable.
    const totalItems = isSearching
        ? searchedTransactions.length
        : defaultTotalItems + pendingTxs.length;

    const onPageSelected = (page: number) => {
        setSelectedPage(page);

        if (!isSearching) {
            fetchPage(page);
        }

        if (sectionRef.current) {
            sectionRef.current.scrollIntoView();
        }
    };

    const startIndex = (currentPage - 1) * perPage;
    const stopIndex = startIndex + perPage;

    // searchedTransactions is a sparse array - not-yet-fetched pages are holes - so it has to be sliced
    // by index before filtering. Filtering first would drop the holes and shift the page offsets.
    const slicedTransactions = useMemo(
        () => searchedTransactions.slice(startIndex, stopIndex),
        [searchedTransactions, startIndex, stopIndex],
    );

    // Only confirmed txs are paginated; pending txs are rendered above the list on every page.
    const confirmedTxs = useMemo(
        () => slicedTransactions.filter(tx => !isPending(tx)),
        [slicedTransactions],
    );

    // if total pages cannot be determined check current page and number of txs (XRP/XLM)
    // Edge case: if there is exactly 25 Ripple/Stellar txs, pagination will be displayed
    const isRippleOrStellar = account.networkType === 'ripple' || account.networkType === 'stellar';
    const isLastRippleOrStellarPage = isRippleOrStellar && slicedTransactions.length < perPage;
    const showRippleOrStellarPagination = !(isLastRippleOrStellarPage && currentPage === 1);
    const showPagination = isRippleOrStellar ? showRippleOrStellarPagination : totalItems > perPage;

    const areTransactionsAvailable = transactions.length > 0 && searchedTransactions.length === 0;

    return (
        <DashboardSection
            ref={sectionRef}
            heading={customHeading ?? <Translation id="TR_ALL_TRANSACTIONS" />}
            actions={
                <TransactionListActions
                    accounts={accounts}
                    symbol={account.symbol}
                    searchQuery={searchQuery}
                    setSearch={search}
                    setSelectedPage={setSelectedPage}
                    isExportable={isExportable}
                    isTxFilteringEnabled={isTxFilteringEnabled}
                />
            }
            data-testid="@wallet/accounts/transaction-list"
        >
            <Column gap={32} padding={{ top: 16 }}>
                {/* TODO: show this skeleton also while searching in txs */}
                <TransactionListBody
                    isLoading={
                        !!isLoading ||
                        (!areAllTransactionsLoaded &&
                            !!searchQuery &&
                            searchedTransactions.length === 0)
                    }
                    hasNoSearchResults={areTransactionsAvailable}
                    pendingTxs={pendingTxs}
                    confirmedTxs={confirmedTxs}
                    accounts={accounts}
                    symbol={symbol}
                />

                <LoadOlderHistory accounts={accounts} />

                {showPagination && (
                    <Pagination
                        hasPages={!isRippleOrStellar}
                        currentPage={currentPage}
                        isLastPage={isLastRippleOrStellarPage}
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
