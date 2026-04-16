import { getNetwork } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import {
    type GroupedTransactionsByDate,
    getTransactionWithLowestNonce,
    groupJointTransactions,
} from '@suite-common/wallet-utils';

import { CoinjoinBatchItem } from 'src/components/wallet/TransactionItem/CoinjoinBatchItem';
import { TransactionItem } from 'src/components/wallet/TransactionItem/TransactionItem';
import { useSelector } from 'src/hooks/suite';
import { type Account, type WalletAccountTransaction } from 'src/types/wallet';

import { TransactionsGroup } from './TransactionsGroup/TransactionsGroup';

interface TransactionGroupedListProps {
    transactionGroups: GroupedTransactionsByDate;
    symbol: WalletAccountTransaction['symbol'];
    account: Account;
    isPending: boolean;
}

export const TransactionGroupedList = ({
    transactionGroups,
    symbol,
    account,
    isPending,
}: TransactionGroupedListProps) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const network = getNetwork(symbol);

    const transactionWithLowestNonce: WalletAccountTransaction | null =
        getTransactionWithLowestNonce(transactionGroups);

    return Object.entries(transactionGroups).map(([dateKey, value], groupIndex) => (
        <TransactionsGroup
            key={dateKey}
            dateKey={dateKey}
            symbol={symbol}
            transactions={value}
            baseCurrencyCode={baseCurrencyCode}
            isPending={isPending}
            index={groupIndex}
        >
            {groupJointTransactions(value).map((item, index) =>
                item.type === 'joint-batch' ? (
                    <CoinjoinBatchItem
                        key={item.rounds[0]?.txid}
                        transactions={item.rounds}
                        isPending={isPending}
                    />
                ) : (
                    <TransactionItem
                        key={item.tx.txid}
                        transaction={item.tx}
                        isPending={isPending}
                        accountKey={account.key}
                        network={network}
                        accountType={account.accountType}
                        index={index}
                        disableBumpFee={
                            network.networkType === 'ethereum'
                                ? item.tx.txid !== transactionWithLowestNonce?.txid
                                : item.tx.type === 'joint'
                        }
                    />
                ),
            )}
        </TransactionsGroup>
    ));
};
