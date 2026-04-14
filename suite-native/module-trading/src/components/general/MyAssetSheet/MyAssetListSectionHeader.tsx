import { useSelector } from 'react-redux';

import { type AccountsRootState, selectFormattedAccountType } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { type NativeAccountsRootState, selectAccountFiatBalance } from '@suite-native/accounts';
import { Badge, HStack, Text } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { AccountLabel } from '@suite-native/labeling';

export type MyAssetListSectionHeaderProps = {
    account: Account;
    isFirst?: boolean;
};

export const TEST_ID_ACCOUNT_TYPE_BADGE = 'account-type-badge';

export const MyAssetListSectionHeader = ({ account, isFirst }: MyAssetListSectionHeaderProps) => {
    const formattedAccountType = useSelector((state: AccountsRootState) =>
        selectFormattedAccountType(state, account.key),
    );

    const fiatBalance = useSelector((state: NativeAccountsRootState) =>
        selectAccountFiatBalance(state, account.key, false),
    );

    return (
        <HStack
            justifyContent="space-between"
            alignItems="center"
            paddingTop={isFirst ? 'sp12' : 'sp40'}
            padding="sp12"
        >
            <HStack alignItems="center" spacing="sp8">
                <Text variant="body-md" color="contentPrimary">
                    <AccountLabel account={account} />
                </Text>
                {formattedAccountType && (
                    <Badge
                        label={formattedAccountType}
                        size="small"
                        elevation="1"
                        variant="blue"
                        testID={TEST_ID_ACCOUNT_TYPE_BADGE}
                    />
                )}
            </HStack>
            <BaseCurrencyAmountFormatter
                numberOfLines={1}
                adjustsFontSizeToFit
                value={fiatBalance}
            />
        </HStack>
    );
};
