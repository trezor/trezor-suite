import { useState } from 'react';

import { Translation } from '@suite/intl';
import { selectIsTransactionStoreActive } from '@suite/transaction-store';
import { hasNetworkPotentialFraudTransactions } from '@suite-common/token-definitions';
import {
    selectAreAllTransactionsLoaded,
    selectIsHideSuspiciousTransactions,
    useDirectRpcHistoryState,
} from '@suite-common/wallet-core';
import { Card, Column, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { type Account, type WalletAccountTransaction } from 'src/types/wallet';

import { StoredTransactionList } from './StoredTransactionList';
import { TransactionList } from './TransactionList';
import { useVisibleTransactions } from './useFetchTransactions';

type EmptyListMessageProps = {
    id: 'TR_NO_VISIBLE_TRANSACTIONS' | 'TR_NO_RECENT_TRANSACTIONS';
};

const EmptyListMessage = ({ id }: EmptyListMessageProps) => (
    <Card>
        <Column alignItems="center">
            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                <Translation id={id} />
            </Text>
        </Column>
    </Card>
);

export const NoVisibleTransactions = () => <EmptyListMessage id="TR_NO_VISIBLE_TRANSACTIONS" />;

interface TransactionListProps {
    symbol: WalletAccountTransaction['symbol'];
    account: Account;
    customTotalItems?: number;
    isExportable?: boolean;
}

const ReduxTransactionList = ({
    account,
    symbol,
    customTotalItems,
    isExportable = true,
}: TransactionListProps) => {
    // NOTE: The number of the displayed pages may be different from the number of the pages for all transactions
    const suspiciousTransactionsHidden = useSelector(state =>
        selectIsHideSuspiciousTransactions(state, symbol),
    );
    const fraudTransactionPossible =
        suspiciousTransactionsHidden && hasNetworkPotentialFraudTransactions(symbol);
    const [visiblePages, setVisiblePages] = useState(1);
    const areAllTransactionsLoaded = useSelector(state =>
        Boolean(selectAreAllTransactionsLoaded(state, account.key)),
    );
    const result = useVisibleTransactions({
        account,
        numberOfPagesRequested: visiblePages,
        enableFiltering: fraudTransactionPossible,
    });

    // A direct-RPC backend only looked at a recent window, so finding nothing there is not the same
    // as the account having no transactions.
    const directRpcHistoryState = useDirectRpcHistoryState(account.key);
    const isRecentWindowEmpty = directRpcHistoryState === 'recentWindowEmpty';

    return (
        <TransactionList
            key={account.key} // NOTE: ensure that transaction list is unmounted when account key changes
            areAllTransactionsLoaded={areAllTransactionsLoaded}
            customPageFetching={fraudTransactionPossible}
            customNoTransactions={
                isRecentWindowEmpty ? (
                    <EmptyListMessage id="TR_NO_RECENT_TRANSACTIONS" />
                ) : (
                    <NoVisibleTransactions />
                )
            }
            allTransactions={result.allTransactions}
            transactions={result.visibleTransactions}
            symbol={symbol}
            account={account}
            isLoading={result.isFetching || directRpcHistoryState === 'unscanned'}
            customTotalItems={customTotalItems ?? result.visibleTotal}
            isExportable={isExportable}
            onPageRequested={setVisiblePages}
        />
    );
};

export const WalletTransactionList = (props: TransactionListProps) => {
    // Read from the transaction store only while its Debug settings switch is on.
    const isTransactionStoreActive = useSelector(selectIsTransactionStoreActive);

    return isTransactionStoreActive ? (
        <StoredTransactionList key={props.account.key} account={props.account} />
    ) : (
        <ReduxTransactionList {...props} />
    );
};
