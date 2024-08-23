import { VStack } from '@suite-native/atoms';

import { GroupedByTypeAccounts, OnSelectAccount } from '../types';
import { AccountsListGroup } from './AccountsListGroup';

type GroupedByTypeAccountsListProps = {
    groupedAccounts: GroupedByTypeAccounts;
    onSelectAccount: OnSelectAccount;
    hideTokens?: boolean;
};

export const GroupedByTypeAccountsList = ({
    groupedAccounts,
    onSelectAccount,
    hideTokens = false,
}: GroupedByTypeAccountsListProps) => (
    <VStack spacing="medium" paddingBottom="medium">
        {Object.entries(groupedAccounts).map(
            ([accountTypeHeader, networkAccounts]) =>
                networkAccounts && (
                    <AccountsListGroup
                        key={accountTypeHeader}
                        accounts={networkAccounts}
                        onSelectAccount={onSelectAccount}
                        hideTokens={hideTokens}
                    />
                ),
        )}
    </VStack>
);
