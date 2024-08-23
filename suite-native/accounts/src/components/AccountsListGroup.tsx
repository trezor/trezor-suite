import { Account } from '@suite-common/wallet-types';
import { VStack } from '@suite-native/atoms';

import { OnSelectAccount } from '../types';
import { AccountListItemInteractive } from './AccountListItemInteractive';

type AccountsListGroupProps = {
    accounts: Account[];
    onSelectAccount: OnSelectAccount;
    hideTokens?: boolean;
};

export const AccountsListGroup = ({
    accounts,
    onSelectAccount,
    hideTokens = false,
}: AccountsListGroupProps) => (
    <VStack spacing="medium">
        {accounts.map(account => (
            <AccountListItemInteractive
                key={account.key}
                account={account}
                onSelectAccount={onSelectAccount}
                hideTokens={hideTokens}
            />
        ))}
    </VStack>
);
