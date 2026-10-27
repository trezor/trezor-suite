import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { findAnchorTransactionPage, selectRouterAnchor } from '@suite/router';
import { getTxsPerPage } from '@suite-common/suite-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    hasNetworkPotentialFraudTransactions,
    isPhishingTransaction,
    selectNetworkTokenDefinitions,
} from '@suite-common/token-definitions';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import {
    selectActiveDustPhishingThreshold,
    selectHistoricFiatRates,
    selectIsHideSuspiciousTransactions,
    selectPhishingTransactions,
} from '@suite-common/wallet-core';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';
import { Card, Column, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { DashboardSection } from 'src/components/dashboard';
import { Pagination } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';

import { TransactionListActions } from './TransactionListActions/TransactionListActions';
import { TransactionListBody } from './TransactionListBody';
import { findTransactionAccount } from './findTransactionAccount';
import { useAccountsTransactions } from './useAccountsTransactions';
import { useTransactionSearch } from './useTransactionSearch';

const NO_TXIDS: string[] = [];

type EmptyListMessageProps = {
    id: 'TR_NO_TRANSACTIONS_YET' | 'TR_NO_VISIBLE_TRANSACTIONS' | 'TR_NO_RECENT_TRANSACTIONS';
};

export const EmptyListMessage = ({ id }: EmptyListMessageProps) => (
    <Card>
        <Column alignItems="center">
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id={id} />
            </Text>
        </Column>
    </Card>
);

type MultiAccountTransactionListProps = {
    accounts: readonly Account[];
    symbol: NetworkSymbol;
    contractAddress?: TokenAddress;
    isAccountShown?: boolean;
    /** A fee is bumped from its account's own screen, so leave it off anywhere else. */
    isBumpFeeAllowed?: boolean;
    isExportable?: boolean;
    knownTotal?: number;
    isHistoryPending?: boolean;
    customNoTransactions?: ReactNode;
    footer?: ReactNode;
    'data-testid'?: string;
};

/** Mount it with a `key` made of the account keys, so its state resets when the accounts change. */
export const MultiAccountTransactionList = ({
    accounts,
    symbol,
    contractAddress,
    isAccountShown = true,
    isBumpFeeAllowed = false,
    isExportable = false,
    knownTotal,
    isHistoryPending = false,
    customNoTransactions,
    footer,
    'data-testid': dataTestId = '@transactions/multi-account',
}: MultiAccountTransactionListProps) => {
    const sectionRef = useRef<HTMLDivElement>(null);
    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();

    const accountKeys = useMemo(() => accounts.map(account => account.key), [accounts]);
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = getTxsPerPage(getNetworkType(symbol));
    const anchor = useSelector(selectRouterAnchor);
    const [searchQuery, setSearchQuery] = useState('');
    const isSearching = searchQuery.trim() !== '';

    const showSearchFailed = () =>
        dispatch(
            notificationsActions.addToast({
                type: 'error',
                error: translationString('TR_SEARCH_FAIL'),
            }),
        );

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
        onError: isSearching ? showSearchFailed : undefined,
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

    const searchedTransactions = useTransactionSearch(accounts, transactions, searchQuery);

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
    // A token's transfers are sparse in the history, so while it loads, a short page is the end of
    // what was found, not a sign of a next page; only a full last page is.
    const isLastPageFull =
        confirmedTransactions.length > 0 && confirmedTransactions.length % perPage === 0;
    const hasNextPage = !isComplete && (contractAddress === undefined || isLastPageFull);
    const loadedTotalItems = isComplete
        ? confirmedTransactions.length
        : Math.max(confirmedTransactions.length + (hasNextPage ? perPage : 0), knownTotal ?? 0);
    const totalItems = isSearching
        ? searchedTransactions.length - pendingTxs.length
        : loadedTotalItems;

    const onPageSelected = (page: number) => {
        setCurrentPage(page);
        sectionRef.current?.scrollIntoView();
    };

    const getCustomNoTransactions = () => {
        if (transactions.length > 0) return undefined;

        if (loadedTransactions.length > 0) {
            return <EmptyListMessage id="TR_NO_VISIBLE_TRANSACTIONS" />;
        }

        return customNoTransactions ?? <EmptyListMessage id="TR_NO_TRANSACTIONS_YET" />;
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
                    isExportable={isExportable}
                />
            }
            data-testid={dataTestId}
        >
            <Column gap={32} padding={{ top: 16 }}>
                <TransactionListBody
                    isLoading={isLoading || isHistoryPending}
                    hasNoSearchResults={
                        isSearching && transactions.length > 0 && searchedTransactions.length === 0
                    }
                    pendingTxs={pendingTxs}
                    confirmedTxs={confirmedTxs}
                    accounts={accounts}
                    symbol={symbol}
                    customNoTransactions={getCustomNoTransactions()}
                    isAccountShown={isAccountShown}
                    isBumpFeeAllowed={isBumpFeeAllowed}
                />
                {footer}
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
