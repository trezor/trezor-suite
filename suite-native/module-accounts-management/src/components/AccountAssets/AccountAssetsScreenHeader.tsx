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
import { CryptoIcon } from '@suite-native/icons';
import {
    type AccountsStackParamList,
    type RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

import { type AccountAssetsFlow } from './types';

type AccountDetailNavigationProps = StackToStackCompositeNavigationProps<
    AccountsStackParamList,
    RootStackRoutes.AccountDetail,
    RootStackParamList
>;

type Props = { accountKey: AccountKey; flowType?: AccountAssetsFlow };

const AccountAssetsScreenHeaderContent = ({ accountKey }: Omit<Props, 'flowType'>) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const fiatBalance = useSelector((state: NativeAccountsRootState) =>
        selectAccountFiatBalance(state, accountKey),
    );

    if (!account) return null;

    return (
        <HStack alignItems="center" spacing="sp8">
            <CryptoIcon symbol={account.symbol} size="small" />
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

export const AccountAssetsScreenHeader = ({ accountKey, flowType }: Props) => {
    const navigation = useNavigation<AccountDetailNavigationProps>();

    const handleSettingsNavigation = () => {
        navigation.navigate(RootStackRoutes.AccountSettings, {
            accountKey,
        });
    };

    return (
        <ScreenHeader
            customContent={<AccountAssetsScreenHeaderContent accountKey={accountKey} />}
            closeActionType={flowType === 'send' ? 'back' : 'close'}
            rightIcon={
                <IconButton
                    intent="neutral"
                    priority="secondary"
                    size="medium"
                    iconName="gear"
                    onPress={handleSettingsNavigation}
                    testID="@account-assets/settings-button"
                />
            }
        />
    );
};
