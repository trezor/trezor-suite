import { useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';
import useDebounce from 'react-use/lib/useDebounce';

import {
    groupTransactionsByDate,
    advancedSearchTransactions,
    groupJointTransactions,
    getAccountNetwork,
} from '@suite-common/wallet-utils';
import { CoinjoinBatchItem } from 'src/components/wallet/TransactionItem/CoinjoinBatchItem';
import { Translation } from 'src/components/suite';
import { DashboardSection } from 'src/components/dashboard';
import { useSelector } from 'src/hooks/suite';
import { WalletAccountTransaction, Account } from 'src/types/wallet';
import { SearchAction } from './TransactionListActions/SearchAction';
import { ExportAction } from './TransactionListActions/ExportAction';
import { TransactionItem } from 'src/components/wallet/TransactionItem/TransactionItem';
import { TransactionsGroup } from './TransactionsGroup/TransactionsGroup';
import { SkeletonTransactionItem } from './SkeletonTransactionItem';
import { NoSearchResults } from './NoSearchResults';
import { TransactionCandidates } from './TransactionCandidates';
import { selectLabelingDataForAccount } from 'src/reducers/suite/metadataReducer';
import { SkeletonStack } from '@trezor/components';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';
import { useFetchTransactions } from './useFetchTransactions';

const StyledSection = styled(DashboardSection)`
    margin-bottom: 20px;
`;

const ActionsWrapper = styled.div`
    display: flex;
    align-items: center;
`;

interface TransactionListProps {
    transactions: WalletAccountTransaction[];
    symbol: WalletAccountTransaction['symbol'];
    isLoading?: boolean;
    account: Account;
    customTotalItems?: number;
    isExportable?: boolean;
}

export const TransactionList = ({
    transactions,
    isLoading,
    account,
    symbol,
    customTotalItems,
    isExportable = true,
}: TransactionListProps) => {
    const localCurrency = useSelector(selectLocalCurrency);
    const anchor = useSelector(state => state.router.anchor);
    const accountMetadata = useSelector(state => selectLabelingDataForAccount(state, account.key));
    const network = getAccountNetwork(account);

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchedTransactions, setSearchedTransactions] = useState(transactions);

    useDebounce(
        () => {
            const results = advancedSearchTransactions(transactions, accountMetadata, searchQuery);
            setSearchedTransactions(results);
        },
        200,
        [transactions, account.metadata, searchQuery, accountMetadata],
    );

    const { fetchNext, fetchAll, fetchedAll } = useFetchTransactions(account, transactions);

    useEffect(() => {
        if (anchor) fetchAll();
    }, [anchor, fetchAll]);

    const isSearching = searchQuery.trim() !== '';

    const transactionsByDate = useMemo(
        () => groupTransactionsByDate(searchedTransactions),
        [searchedTransactions],
    );

    const listItems = useMemo(
        () =>
            Object.entries(transactionsByDate).map(([dateKey, value], groupIndex) => {
                const isPending = dateKey === 'pending';

                return (
                    <TransactionsGroup
                        key={dateKey}
                        dateKey={dateKey}
                        symbol={symbol}
                        transactions={value}
                        localCurrency={localCurrency}
                        index={groupIndex}
                    >
                        {groupJointTransactions(value).map((item, index) =>
                            item.type === 'joint-batch' ? (
                                <CoinjoinBatchItem
                                    key={item.rounds[0].txid}
                                    transactions={item.rounds}
                                    isPending={isPending}
                                    localCurrency={localCurrency}
                                />
                            ) : (
                                <TransactionItem
                                    key={item.tx.txid}
                                    transaction={item.tx}
                                    isPending={isPending}
                                    accountMetadata={accountMetadata}
                                    accountKey={account.key}
                                    network={network!}
                                    index={index}
                                />
                            ),
                        )}
                    </TransactionsGroup>
                );
            }),
        [transactionsByDate, account.key, localCurrency, symbol, network, accountMetadata],
    );

    const areTransactionsAvailable = transactions.length > 0 && searchedTransactions.length === 0;

    return (
        <StyledSection
            heading={<Translation id="TR_ALL_TRANSACTIONS" />}
            actions={
                <ActionsWrapper>
                    <SearchAction
                        account={account}
                        searchQuery={searchQuery}
                        setSearch={setSearchQuery}
                        fetchAll={fetchAll}
                    />
                    {isExportable && (
                        <ExportAction
                            account={account}
                            searchQuery={searchQuery}
                            accountMetadata={accountMetadata}
                            fetchAll={fetchAll}
                        />
                    )}
                </ActionsWrapper>
            }
            data-test="@wallet/accounts/transaction-list"
        >
            {account.accountType === 'coinjoin' && !isSearching && (
                <TransactionCandidates accountKey={account.key} />
            )}

            {/* TODO: show this skeleton also while searching in txs */}
            {isLoading ? (
                <SkeletonStack $col $childMargin="0px 0px 16px 0px">
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                    <SkeletonTransactionItem />
                </SkeletonStack>
            ) : (
                <>{areTransactionsAvailable ? <NoSearchResults /> : listItems}</>
            )}

            {/* TODO add fetching logic */}
        </StyledSection>
    );
};
