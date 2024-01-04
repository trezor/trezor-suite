import { HeaderedCard, VStack } from '@suite-native/atoms';
import { Account, AccountKey, TokenAddress } from '@suite-common/wallet-types';

import { AccountListItemInteractive } from './AccountListItemInteractive';

type AccountsListGroupProps = {
    groupHeader: string;
    accounts: Account[];
    onSelectAccount: (accountKey: AccountKey, tokenContract?: TokenAddress) => void;
};

export const AccountsListGroup = ({
    groupHeader,
    accounts,
    onSelectAccount,
}: AccountsListGroupProps) => (
    <HeaderedCard title={groupHeader}>
        <VStack spacing="medium">
            {accounts.map(account => (
                <AccountListItemInteractive
                    key={account.key}
                    account={account}
                    onSelectAccount={onSelectAccount}
                />
            ))}
        </VStack>
    </HeaderedCard>
);
