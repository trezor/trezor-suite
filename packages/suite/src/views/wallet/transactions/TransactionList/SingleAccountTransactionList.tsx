import { useMemo } from 'react';

import {
    selectAccountTransactionsWithNulls,
    useDirectRpcHistoryState,
} from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';
import { type Account, type WalletAccountTransaction } from 'src/types/wallet';

import { LoadOlderHistory } from './LoadOlderHistory';
import { EmptyListMessage, MultiAccountTransactionList } from './MultiAccountTransactionList';

type SingleAccountTransactionListProps = {
    symbol: WalletAccountTransaction['symbol'];
    account: Account;
    isExportable?: boolean;
};

export const SingleAccountTransactionList = ({
    account,
    symbol,
    isExportable = true,
}: SingleAccountTransactionListProps) => {
    const accounts = useMemo(() => [account], [account]);
    const loadedCount = useSelector(
        state => selectAccountTransactionsWithNulls(state, account.key).length,
    );
    // A direct-RPC backend only looked at a recent window, so finding nothing there is not the same
    // as the account having no transactions.
    const directRpcHistoryState = useDirectRpcHistoryState(account.key);

    return (
        <MultiAccountTransactionList
            key={account.key}
            accounts={accounts}
            symbol={symbol}
            isAccountShown={false}
            isBumpFeeAllowed
            isExportable={isExportable}
            knownTotal={account.history.total}
            isHistoryPending={directRpcHistoryState === 'unscanned'}
            customNoTransactions={
                directRpcHistoryState === 'recentWindowEmpty' ? (
                    <EmptyListMessage id="TR_NO_RECENT_TRANSACTIONS" />
                ) : undefined
            }
            footer={<LoadOlderHistory account={account} loadedCount={loadedCount} />}
            data-testid="@wallet/accounts/transaction-list"
        />
    );
};
