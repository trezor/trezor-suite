import { Card, VStack } from '@suite-native/atoms';
import { Account, AccountKey, TokenAddress } from '@suite-common/wallet-types';

import { AccountListItemInteractive } from './AccountListItemInteractive';

type AccountsListGroupProps = {
    accounts: Account[];
    onSelectAccount: (accountKey: AccountKey, tokenContract?: TokenAddress) => void;
};

export const AccountsListGroup = ({ accounts, onSelectAccount }: AccountsListGroupProps) => (
    <Card>
        <VStack spacing="medium">
            {accounts.map(account => (
                <AccountListItemInteractive
                    key={account.key}
                    account={account}
                    onSelectAccount={onSelectAccount}
                />
            ))}
        </VStack>
    </Card>
);
