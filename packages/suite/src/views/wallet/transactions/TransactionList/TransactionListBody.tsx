import { type ReactNode, useMemo } from 'react';

import { groupTransactionsByDate } from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';

import { type Account, type WalletAccountTransaction } from 'src/types/wallet';

import { NoSearchResults } from './NoSearchResults';
import { SkeletonTransactionItem } from './SkeletonTransactionItem';
import { TransactionGroupedList } from './TransactionGroupedList';
import { PendingGroupHeader } from './TransactionsGroup/PendingGroupHeader';

type TransactionListBodyProps = {
    isLoading: boolean;
    hasNoSearchResults: boolean;
    pendingTxs: WalletAccountTransaction[];
    confirmedTxs: WalletAccountTransaction[];
    accounts: readonly Account[];
    symbol: WalletAccountTransaction['symbol'];
    customNoTransactions?: ReactNode;
    isAccountShown?: boolean;
};

export const TransactionListBody = ({
    isLoading,
    hasNoSearchResults,
    pendingTxs,
    confirmedTxs,
    accounts,
    symbol,
    customNoTransactions,
    isAccountShown,
}: TransactionListBodyProps) => {
    const pendingTxsByDate = useMemo(
        () => groupTransactionsByDate(pendingTxs, 'day'),
        [pendingTxs],
    );
    const confirmedTxsByDate = useMemo(
        () => groupTransactionsByDate(confirmedTxs, 'day'),
        [confirmedTxs],
    );

    if (isLoading) {
        return (
            <Column gap={16}>
                <SkeletonTransactionItem />
                <SkeletonTransactionItem />
                <SkeletonTransactionItem />
            </Column>
        );
    }

    const isEmpty = confirmedTxs.length === 0 && pendingTxs.length === 0;

    return (
        <Column gap={40}>
            {hasNoSearchResults && <NoSearchResults />}
            {!hasNoSearchResults &&
                (customNoTransactions && isEmpty ? (
                    customNoTransactions
                ) : (
                    <>
                        {pendingTxs.length > 0 && (
                            <PendingGroupHeader txsCount={pendingTxs.length} />
                        )}
                        <TransactionGroupedList
                            transactionGroups={pendingTxsByDate}
                            symbol={symbol}
                            accounts={accounts}
                            isPending={true}
                            isAccountShown={isAccountShown}
                        />
                        <TransactionGroupedList
                            transactionGroups={confirmedTxsByDate}
                            symbol={symbol}
                            accounts={accounts}
                            isPending={false}
                            isAccountShown={isAccountShown}
                        />
                    </>
                ))}
        </Column>
    );
};
