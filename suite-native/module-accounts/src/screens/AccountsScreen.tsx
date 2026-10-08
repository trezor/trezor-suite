import { useMemo } from 'react';

import { isStakingSymbol } from '@suite-common/wallet-utils';
import { AccountsListWithFilter, type OnSelectAccount } from '@suite-native/accounts';
import { useScrollDivider } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { AccountsRediscoveryNeededWarning } from '@suite-native/discovery';
import { Translation } from '@suite-native/intl';
import {
    AccountDetailStackRoutes,
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
    const { scrollDivider, handleScroll } = useScrollDivider();

    const networksFilter = useMemo(
        () => route.params?.networksFilter ?? [],
        [route.params?.networksFilter],
    );

    const handleSelectAccount: OnSelectAccount = ({ account }) => {
        const { key: accountKey, symbol } = account;

        if (isNetworkWithTokens(symbol) || isStakingSymbol(symbol)) {
            navigation.navigate(RootStackRoutes.AccountOverview, { accountKey });

            return;
        }
        navigation.navigate(RootStackRoutes.AccountDetailStack, {
            screen: AccountDetailStackRoutes.AccountDetail,
            params: {
                accountKey,
                closeActionType: 'back',
            },
        });
    };

    return (
        <Screen
            header={<DeviceManagerScreenHeader />}
            isScrollable={false}
            noHorizontalPadding
            noBottomPadding
        >
            {scrollDivider}
            <AccountsListWithFilter
                title={<Translation id="moduleAccountManagement.accountsScreen.accountsTitle" />}
                onSelectAccount={handleSelectAccount}
                flowType="accounts"
                networksFilter={networksFilter}
                onScroll={handleScroll}
                noHeaderPaddingTop
            >
                <AccountsRediscoveryNeededWarning />
            </AccountsListWithFilter>
        </Screen>
    );
};
