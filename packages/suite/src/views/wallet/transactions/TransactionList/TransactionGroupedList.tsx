import {
    getAccountNetwork,
    GroupedTransactionsByDate,
    groupJointTransactions,
} from '@suite-common/wallet-utils';
import { CoinjoinBatchItem } from 'src/components/wallet/TransactionItem/CoinjoinBatchItem';
import { useSelector } from 'src/hooks/suite';
import { Account, WalletAccountTransaction } from 'src/types/wallet';
import { TransactionItem } from 'src/components/wallet/TransactionItem/TransactionItem';
import { TransactionsGroup } from './TransactionsGroup/TransactionsGroup';
import { selectLabelingDataForAccount } from 'src/reducers/suite/metadataReducer';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';

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
    const localCurrency = useSelector(selectLocalCurrency);
    const accountMetadata = useSelector(state => selectLabelingDataForAccount(state, account.key));
    const network = getAccountNetwork(account);

    return Object.entries(transactionGroups).map(([dateKey, value], groupIndex) => (
        <TransactionsGroup
            key={dateKey}
            dateKey={dateKey}
            symbol={symbol}
            transactions={value}
            localCurrency={localCurrency}
            isPending={isPending}
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
    ));
};
