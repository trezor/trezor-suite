import { useMemo } from 'react';

import { isStakingSymbol } from '@suite-common/wallet-utils';
import { AccountsListWithFilter, type OnSelectAccount } from '@suite-native/accounts';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { AccountsRediscoveryNeededWarning } from '@suite-native/discovery';
import { Translation } from '@suite-native/intl';
import {
    type AccountsStackParamList,
    type AccountsStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    Screen,
    type StackToStackCompositeScreenProps,
} from '@suite-native/navigation';
import { isNetworkWithTokens } from '@suite-native/tokens';

type ScreenNavigationProps = StackToStackCompositeScreenProps<
    AccountsStackParamList,
    AccountsStackRoutes.Accounts,
    RootStackParamList
>;

export const AccountsScreen = ({ navigation, route }: ScreenNavigationProps) => {
    const networksFilter = useMemo(
        () => route.params?.networksFilter ?? [],
        [route.params?.networksFilter],
    );

    const handleSelectAccount: OnSelectAccount = ({ account }) => {
        const { key: accountKey, symbol } = account;

        if (isNetworkWithTokens(symbol) || isStakingSymbol(symbol)) {
            navigation.navigate(RootStackRoutes.AccountAssets, { accountKey });

            return;
        }
        navigation.navigate(RootStackRoutes.AccountDetail, {
            accountKey,
            closeActionType: 'back',
        });
    };

    return (
        // noBottomPadding: SearchableAccountsListHeader owns the top spacing to accommodate filter badge overflow.
        <Screen header={<DeviceManagerScreenHeader noBottomPadding />} isScrollable={false}>
            <AccountsListWithFilter
                title={<Translation id="moduleAccountManagement.accountsScreen.accountsTitle" />}
                onSelectAccount={handleSelectAccount}
                flowType="accounts"
                networksFilter={networksFilter}
                isScrollDividerEnabled
            >
                <AccountsRediscoveryNeededWarning />
            </AccountsListWithFilter>
        </Screen>
    );
};
