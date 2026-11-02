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
import { findTransactionAccount } from './findTransactionAccount';

interface TransactionGroupedListProps {
    transactionGroups: GroupedTransactionsByDate;
    symbol: WalletAccountTransaction['symbol'];
    accounts: readonly Account[];
    isPending: boolean;
    /** Rows of several accounts, or of one asset's transfers, each name their account. */
    isAccountShown?: boolean;
    isBumpFeeAllowed?: boolean;
}

export const TransactionGroupedList = ({
    transactionGroups,
    symbol,
    accounts,
    isPending,
    isAccountShown = false,
    isBumpFeeAllowed = true,
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
            accounts={accounts}
            transactions={value}
            baseCurrencyCode={baseCurrencyCode}
            isPending={isPending}
            index={groupIndex}
        >
            {groupJointTransactions(value).map((item, index) => {
                if (item.type === 'joint-batch') {
                    return (
                        <CoinjoinBatchItem
                            key={item.rounds[0]?.txid}
                            transactions={item.rounds}
                            isPending={isPending}
                        />
                    );
                }

                const account = findTransactionAccount(accounts, item.tx);

                return (
                    account && (
                        <TransactionItem
                            key={`${account.key}/${item.tx.txid}`}
                            transaction={item.tx}
                            isPending={isPending}
                            accountKey={account.key}
                            network={network}
                            accountType={account.accountType}
                            index={index}
                            isAccountShown={isAccountShown}
                            disableBumpFee={
                                !isBumpFeeAllowed ||
                                (network.networkType === 'ethereum'
                                    ? item.tx.txid !== transactionWithLowestNonce?.txid
                                    : item.tx.type === 'joint')
                            }
                        />
                    )
                );
            })}
        </TransactionsGroup>
    ));
};
