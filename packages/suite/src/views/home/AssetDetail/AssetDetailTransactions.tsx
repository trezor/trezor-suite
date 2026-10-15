import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from 'react-use';

import { Translation, useTranslation } from '@suite/intl';
import {
    selectWalletAssetAccountKeys,
    selectWalletAssetSymbol,
    selectWalletAssetTransactions,
} from '@suite-common/assets';
import { getTxsPerPage } from '@suite-common/suite-utils';
import {
    type SearchAccountLabels,
    advancedSearchTransactions,
} from '@suite-common/transaction-search';
import { getNetwork } from '@suite-common/wallet-config';
import {
    type WalletAssetKey,
    fetchAllTransactionsForAccountThunk,
    selectAccountByKey,
    selectBaseCurrency,
    selectIsLoadingAccountTransactions,
} from '@suite-common/wallet-core';
import { type Account, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { groupTransactionsByDate, isPending } from '@suite-common/wallet-utils';
import { Card, Column, Icon, Input, Text } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { MagnifyingGlassIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { DashboardSection } from 'src/components/dashboard';
import { Pagination } from 'src/components/wallet';
import { TransactionItem } from 'src/components/wallet/TransactionItem/TransactionItem';
import { useSelector } from 'src/hooks/suite';
import { selectAccountLabelsForSearch } from 'src/selectors/suite/selectAccountLabelsForSearch';
import { NoSearchResults } from 'src/views/wallet/transactions/TransactionList/NoSearchResults';
import { SkeletonTransactionItem } from 'src/views/wallet/transactions/TransactionList/SkeletonTransactionItem';
import { PendingGroupHeader } from 'src/views/wallet/transactions/TransactionList/TransactionsGroup/PendingGroupHeader';
import { TransactionsGroup } from 'src/views/wallet/transactions/TransactionList/TransactionsGroup/TransactionsGroup';

const SEARCH_DEBOUNCE_MS = 200;

const NO_LABELS: SearchAccountLabels = {
    accountLabel: null,
    outputLabels: new Map(),
    addressLabels: new Map(),
};

const isOfAccount = (transaction: WalletAccountTransaction, account: Account) =>
    transaction.descriptor === account.descriptor &&
    transaction.symbol === account.symbol &&
    transaction.deviceState === account.deviceState;

type AssetTransactionGroupsProps = {
    transactions: WalletAccountTransaction[];
    accounts: readonly Account[];
    isPending: boolean;
};

/**
 * The account page's day groups and rows, for transactions of several accounts: each row says which
 * account it belongs to, and is read against that account rather than the selected one.
 */
const AssetTransactionGroups = ({
    transactions,
    accounts,
    isPending: arePending,
}: AssetTransactionGroupsProps) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const groups = useMemo(() => groupTransactionsByDate(transactions, 'day'), [transactions]);

    return Object.entries(groups).map(([dateKey, groupTransactions], groupIndex) => {
        const [firstTransaction] = groupTransactions;
        const groupAccount =
            firstTransaction && accounts.find(account => isOfAccount(firstTransaction, account));

        if (firstTransaction === undefined || groupAccount === undefined) {
            return null;
        }

        return (
            <TransactionsGroup
                key={dateKey}
                dateKey={dateKey}
                symbol={firstTransaction.symbol}
                account={groupAccount}
                transactions={groupTransactions}
                baseCurrencyCode={baseCurrencyCode}
                isPending={arePending}
                index={groupIndex}
            >
                {groupTransactions.map((transaction, index) => {
                    const account = accounts.find(candidate => isOfAccount(transaction, candidate));

                    return (
                        account && (
                            <TransactionItem
                                key={`${account.key}/${transaction.txid}`}
                                transaction={transaction}
                                isPending={arePending}
                                accountKey={account.key}
                                network={getNetwork(transaction.symbol)}
                                accountType={account.accountType}
                                index={index}
                                // Bumping depends on the account's own nonce order, so it stays on
                                // the account page, where that order is known.
                                disableBumpFee
                                isAccountShown
                            />
                        )
                    );
                })}
            </TransactionsGroup>
        );
    });
};

type AssetDetailTransactionsProps = {
    assetKey: WalletAssetKey;
};

export const AssetDetailTransactions = ({ assetKey }: AssetDetailTransactionsProps) => {
    const { dispatch } = useServices(injectDispatch);
    const { translationString } = useTranslation();
    const sectionRef = useRef<HTMLDivElement>(null);

    const symbol = useSelector(state => selectWalletAssetSymbol(state, assetKey));
    const accountKeys = useSelector(state => selectWalletAssetAccountKeys(state, assetKey));
    const transactions = useSelector(state => selectWalletAssetTransactions(state, assetKey));
    // `useSelector` compares with `shallowEqual` by default, so both lists stay put between writes
    // that change none of their accounts or labels.
    const accounts = useSelector(state =>
        accountKeys
            .map(accountKey => selectAccountByKey(state, accountKey))
            .filter((account): account is Account => account !== null),
    );
    const accountLabels = useSelector(state =>
        accounts.map(account => selectAccountLabelsForSearch(state, account)),
    );
    const isLoading = useSelector(state =>
        accountKeys.some(accountKey => selectIsLoadingAccountTransactions(state, accountKey)),
    );

    // An account loads only its first page on its own; the asset's history needs all of it.
    useEffect(() => {
        accountKeys.forEach(accountKey => {
            dispatch(fetchAllTransactionsForAccountThunk({ accountKey }));
        });
    }, [accountKeys, dispatch]);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchedTransactions, setSearchedTransactions] =
        useState<readonly WalletAccountTransaction[]>(transactions);

    useDebounce(
        () => {
            if (searchQuery.trim() === '') {
                setSearchedTransactions(transactions);

                return;
            }

            // Labels belong to an account, so each account's transactions are searched with its own.
            setSearchedTransactions(
                accounts.flatMap((account, index) =>
                    advancedSearchTransactions(
                        transactions.filter(transaction => isOfAccount(transaction, account)),
                        accountLabels[index] ?? NO_LABELS,
                        searchQuery,
                    ),
                ),
            );
        },
        SEARCH_DEBOUNCE_MS,
        [transactions, accounts, accountLabels, searchQuery],
    );

    const [currentPage, setCurrentPage] = useState(1);
    const perPage = symbol === undefined ? 0 : getTxsPerPage(getNetwork(symbol).networkType);

    // Pending transactions stay above the list on every page, as on the account page.
    const pendingTransactions = useMemo(
        () => searchedTransactions.filter(isPending),
        [searchedTransactions],
    );
    const confirmedTransactions = useMemo(
        () => searchedTransactions.filter(transaction => !isPending(transaction)),
        [searchedTransactions],
    );
    const pageTransactions = useMemo(
        () => confirmedTransactions.slice((currentPage - 1) * perPage, currentPage * perPage),
        [confirmedTransactions, currentPage, perPage],
    );

    const onPageSelected = (page: number) => {
        setCurrentPage(page);
        sectionRef.current?.scrollIntoView();
    };

    const onSearch = (query: string) => {
        setCurrentPage(1);
        setSearchQuery(query);
    };

    if (symbol === undefined) {
        return null;
    }

    const isSearching = searchQuery.trim() !== '';
    const hasNoTransactions = transactions.length === 0;

    const renderContent = () => {
        if (hasNoTransactions && isLoading) {
            return (
                <Column gap={16}>
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                </Column>
            );
        }

        if (hasNoTransactions) {
            return (
                <Card>
                    <Column alignItems="center">
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation id="TR_ASSET_DETAIL_NO_TRANSACTIONS" />
                        </Text>
                    </Column>
                </Card>
            );
        }

        if (isSearching && searchedTransactions.length === 0) {
            return <NoSearchResults />;
        }

        return (
            <Column gap={40}>
                {pendingTransactions.length > 0 && (
                    <>
                        <PendingGroupHeader txsCount={pendingTransactions.length} />
                        <AssetTransactionGroups
                            transactions={pendingTransactions}
                            accounts={accounts}
                            isPending
                        />
                    </>
                )}
                <AssetTransactionGroups
                    transactions={pageTransactions}
                    accounts={accounts}
                    isPending={false}
                />
            </Column>
        );
    };

    return (
        <DashboardSection
            ref={sectionRef}
            heading={<Translation id="TR_ALL_TRANSACTIONS" />}
            actions={
                <Input
                    data-testid="@asset-detail/search"
                    placeholder={translationString('TR_SEARCH_TRANSACTIONS')}
                    value={searchQuery}
                    onChange={event => onSearch(event.target.value)}
                    onClear={() => onSearch('')}
                    size="small"
                    leftContent={
                        <Icon
                            as={MagnifyingGlassIcon}
                            intent="neutral"
                            priority="secondary"
                            size={16}
                        />
                    }
                />
            }
            data-testid="@asset-detail/transactions"
        >
            <Column gap={32} padding={{ top: 16 }}>
                {renderContent()}
                {confirmedTransactions.length > perPage && (
                    <Pagination
                        currentPage={currentPage}
                        perPage={perPage}
                        totalItems={confirmedTransactions.length}
                        onPageSelected={onPageSelected}
                        explicitNavigation
                    />
                )}
            </Column>
        </DashboardSection>
    );
};
