import { Translation } from '@suite/intl';
import {
    selectAccountStakeTypeTransactions,
    selectAccountTransactionsWithNulls,
    selectAreAllTransactionsLoaded,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';
import { TransactionList } from 'src/views/wallet/transactions/TransactionList/TransactionList';

type TransactionsProps = {
    account: Account;
};

export const Transactions = ({ account }: TransactionsProps) => {
    const accountKey = account.key;

    const areAllTransactionsLoaded = useSelector(state =>
        Boolean(selectAreAllTransactionsLoaded(state, accountKey)),
    );
    const allTransactions = useSelector(state =>
        selectAccountTransactionsWithNulls(state, accountKey),
    );
    const stakeTxs = useSelector(state => selectAccountStakeTypeTransactions(state, accountKey));

    if (stakeTxs.length < 1) {
        return null;
    }

    return (
        <TransactionList
            key={account.key} // NOTE: ensure that transaction list is unmounted when account key changes
            areAllTransactionsLoaded={areAllTransactionsLoaded}
            allTransactions={allTransactions}
            account={account}
            transactions={stakeTxs}
            symbol={account.symbol}
            isLoading={!areAllTransactionsLoaded}
            customTotalItems={stakeTxs.length}
            customHeading={<Translation id="TR_STAKING_TRANSACTIONS" />}
            isExportable={false}
            isTxFilteringEnabled={false}
        />
    );
};
