import { selectFullSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import {
    selectAccountStakeTypeTransactions,
    selectAreAllTransactionsLoaded,
} from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';
import { useStoreTransactionsSource } from 'src/hooks/wallet/chainData/useAccountTransactionsSource';
import { type Account, type WalletAccountTransaction } from 'src/types/wallet';
import { TransactionList } from 'src/views/wallet/transactions/TransactionList/TransactionList';

type StakingTransactionListProps = {
    account: Account;
    stakeTxs: WalletAccountTransaction[];
    areAllTransactionsLoaded: boolean;
};

// Staking reads the wallet store until staking moves to chain data.
const StakingTransactionList = ({
    account,
    stakeTxs,
    areAllTransactionsLoaded,
}: StakingTransactionListProps) => {
    const source = useStoreTransactionsSource(account);

    return (
        <TransactionList
            key={account.key} // NOTE: ensure that transaction list is unmounted when account key changes
            areAllTransactionsLoaded={areAllTransactionsLoaded}
            source={source}
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

export const Transactions = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const accountKey = selectedAccount.account?.key ?? null;

    const areAllTransactionsLoaded = useSelector(state =>
        Boolean(selectAreAllTransactionsLoaded(state, accountKey)),
    );
    const stakeTxs = useSelector(state => selectAccountStakeTypeTransactions(state, accountKey));

    if (selectedAccount.status !== 'loaded' || stakeTxs.length < 1) {
        return null;
    }

    return (
        <StakingTransactionList
            account={selectedAccount.account}
            stakeTxs={stakeTxs}
            areAllTransactionsLoaded={areAllTransactionsLoaded}
        />
    );
};
