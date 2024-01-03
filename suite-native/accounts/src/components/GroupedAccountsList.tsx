import React from 'react';

import { VStack } from '@suite-native/atoms';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';

import { GroupedAccounts } from '../types';
import { AccountsListGroup } from './AccountsListGroup';

type GroupedAccountsListProps = {
    groupedAccounts: GroupedAccounts;
    onSelectAccount: (accountKey: AccountKey, tokenContract?: TokenAddress) => void;
};

export const GroupedAccountsList = ({
    groupedAccounts,
    onSelectAccount,
}: GroupedAccountsListProps) => (
    <VStack spacing="large" paddingBottom="medium">
        {Object.entries(groupedAccounts).map(
            ([accountTypeHeader, networkAccounts]) =>
                networkAccounts && (
                    <AccountsListGroup
                        key={accountTypeHeader}
                        groupHeader={accountTypeHeader}
                        accounts={networkAccounts}
                        onSelectAccount={onSelectAccount}
                    />
                ),
        )}
    </VStack>
);
