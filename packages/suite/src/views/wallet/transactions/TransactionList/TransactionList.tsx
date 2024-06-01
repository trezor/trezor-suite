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

const TEMPINFOPANEL = ({
    info,
    searched,
    filtered,
}: {
    info: ReturnType<typeof useFetchTransactions>['TEMPINFO'];
    searched: WalletAccountTransaction[];
    filtered: WalletAccountTransaction[];
}) => (
    <div style={{ alignSelf: 'center', marginTop: '16px' }}>
        FETCHED {info.pagesFetched}/{info.pagesTotal} PAGES ({info.txFetched}/{info.txTotal} TXS)
        <br />
        {info.txFetched} -&gt; FILTER -&gt; {filtered.length} -&gt; SEARCH -&gt; {searched.length}
    </div>
);

const TEMPBUTTON = ({
    fetchedAll,
    fetchNext,
}: {
    fetchedAll: boolean;
    fetchNext: () => unknown;
}) => (
    <button
        disabled={fetchedAll}
        onClick={fetchNext}
        style={{ alignSelf: 'center', marginTop: '16px', padding: '12px' }}
    >
        LOAD MORE
    </button>
);

interface TransactionListProps {
    account: Account;
    transactions: WalletAccountTransaction[];
    transactionFilter?: (tx: WalletAccountTransaction) => boolean;
    isLoading?: boolean;
    isExportable?: boolean;
}

export const TransactionList = ({
    account,
    transactions,
    transactionFilter,
    isLoading,
    isExportable = true,
}: TransactionListProps) => {
    const localCurrency = useSelector(selectLocalCurrency);
    const anchor = useSelector(state => state.router.anchor);
    const accountMetadata = useSelector(state => selectLabelingDataForAccount(state, account.key));
    const network = getAccountNetwork(account);

    // Filter
    const filteredTransactions = useMemo(
        () => (transactionFilter ? transactions.filter(transactionFilter) : transactions),
        [transactions, transactionFilter],
    );

    // Search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchedTransactions, setSearchedTransactions] = useState(filteredTransactions);

    useDebounce(
        () => {
            const results = advancedSearchTransactions(
                filteredTransactions,
                accountMetadata,
                searchQuery,
            );
            setSearchedTransactions(results);
        },
        200,
        [filteredTransactions, account.metadata, searchQuery, accountMetadata],
    );

    const { fetchNext, fetchAll, fetchedAll, TEMPINFO } = useFetchTransactions(
        account,
        transactions,
    );

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
                        symbol={account.symbol}
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
        [transactionsByDate, account.key, localCurrency, account.symbol, network, accountMetadata],
    );

    const areTransactionsAvailable =
        filteredTransactions.length > 0 && searchedTransactions.length === 0;

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

            <TEMPINFOPANEL
                info={TEMPINFO}
                searched={searchedTransactions}
                filtered={filteredTransactions}
            />
            <TEMPBUTTON fetchNext={fetchNext} fetchedAll={fetchedAll} />
        </StyledSection>
    );
};
