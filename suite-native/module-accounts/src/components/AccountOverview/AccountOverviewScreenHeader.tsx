import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { isAccountFailed } from '@suite-common/wallet-utils';
import {
    AccountLabel,
    type NativeAccountsRootState,
    selectAccountFiatBalance,
} from '@suite-native/accounts';
import { HStack, IconButton, VStack } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import {
    AccountDetailStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';

type AccountOverviewNavigationProps = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.AccountOverview
>;

type AccountOverviewScreenHeaderProps = {
    accountKey: AccountKey;
};

type AccountOverviewScreenHeaderContentProps = Pick<AccountOverviewScreenHeaderProps, 'accountKey'>;

const AccountOverviewScreenHeaderContent = ({
    accountKey,
}: AccountOverviewScreenHeaderContentProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const fiatBalance = useSelector((state: NativeAccountsRootState) =>
        selectAccountFiatBalance(state, accountKey),
    );

    if (!account) return null;

    return (
        <HStack alignItems="center" spacing="sp8">
            <TokenIcon tokenSymbol={account.symbol} networkSymbol={account.symbol} size="small" />
            <VStack spacing={0} alignItems="flex-start">
                <AccountLabel
                    account={account}
                    variant="body-md-strong"
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    showAccountTypeBadge
                />
                {!isAccountFailed(account) && (
                    <BaseCurrencyAmountFormatter
                        value={fiatBalance}
                        variant="body-sm"
                        color="contentSecondary"
                    />
                )}
            </VStack>
        </HStack>
    );
};

export const AccountOverviewScreenHeader = ({
    accountKey,
}: AccountOverviewScreenHeaderProps) => {
    const navigation = useNavigation<AccountOverviewNavigationProps>();

    const handleSettingsNavigation = () => {
        navigation.navigate(RootStackRoutes.AccountDetailStack, {
            screen: AccountDetailStackRoutes.AccountSettings,
            params: { accountKey },
        });
    };

    return (
        <ScreenHeader
            customContent={<AccountOverviewScreenHeaderContent accountKey={accountKey} />}
            closeActionType="back"
            rightIcon={
                <IconButton
                    intent="neutral"
                    priority="secondary"
                    size="medium"
                    iconName="gear"
                    onPress={handleSettingsNavigation}
                    testID="@account-overview/settings-button"
                />
            }
        />
    );
};
