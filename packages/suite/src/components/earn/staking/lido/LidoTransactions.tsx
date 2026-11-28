import { Translation } from '@suite/intl';
import {
    getAccountTransactionLidoKind,
    selectAccountTransactions,
    selectAccountTransactionsWithNulls,
    selectAreAllTransactionsLoaded,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getLidoDeployment } from '@trezor/network-ethereum-suite-common';

import { useSelector } from '#src/hooks/suite/useSelector';
import { TransactionList } from '#src/views/wallet/transactions/TransactionList/TransactionList';

type LidoTransactionsProps = {
    account: Account;
};

/** The account's stakes, withdrawal requests and claims with Lido. */
export const LidoTransactions = ({ account }: LidoTransactionsProps) => {
    const accountKey = account.key;

    const areAllTransactionsLoaded = useSelector(state =>
        Boolean(selectAreAllTransactionsLoaded(state, accountKey)),
    );
    const allTransactions = useSelector(state =>
        selectAccountTransactionsWithNulls(state, accountKey),
    );
    const transactions = useSelector(state => selectAccountTransactions(state, accountKey));
    const deployment = getLidoDeployment(account.symbol);
    const lidoTransactions = transactions.filter(transaction => {
        const kind =
            deployment === null ? null : getAccountTransactionLidoKind({ deployment, transaction });

        return kind !== null && kind !== 'approve';
    });

    if (lidoTransactions.length === 0) {
        return null;
    }

    return (
        <TransactionList
            key={accountKey}
            areAllTransactionsLoaded={areAllTransactionsLoaded}
            allTransactions={allTransactions}
            account={account}
            transactions={lidoTransactions}
            symbol={account.symbol}
            isLoading={!areAllTransactionsLoaded}
            customTotalItems={lidoTransactions.length}
            customHeading={<Translation id="TR_STAKING_TRANSACTIONS" />}
            isExportable={false}
            isTxFilteringEnabled={false}
        />
    );
};
