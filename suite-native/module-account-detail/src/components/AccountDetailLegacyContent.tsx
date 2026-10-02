import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { TransactionList } from '@suite-native/transactions';

import { AccountDetailEmptyState } from './AccountDetailEmptyState';
import { TransactionListHeader } from './TransactionListHeader';

type AccountDetailLegacyContentProps = {
    account: Account;
    tokenContract?: TokenAddress;
};

export const AccountDetailLegacyContent = ({
    account,
    tokenContract,
}: AccountDetailLegacyContentProps) => (
    <TransactionList
        account={account}
        tokenContract={tokenContract}
        listHeaderComponent={
            <TransactionListHeader accountKey={account.key} tokenContract={tokenContract} />
        }
        listEmptyComponent={
            <AccountDetailEmptyState accountKey={account.key} tokenContract={tokenContract} />
        }
    />
);
