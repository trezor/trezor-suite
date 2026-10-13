import { useMemo } from 'react';

import { ExperimentId, useIsExperimentVariantActive } from '@suite-common/message-system';
import { isStakingSymbol } from '@suite-common/wallet-utils';
import { AccountsListWithFilter, type OnSelectAccount } from '@suite-native/accounts';
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
import { ScreenPerformanceRoot, useIsAccountsScreenReady } from '@suite-native/performance-metrics';
import { isNetworkWithTokens } from '@suite-native/tokens';

type ScreenNavigationProps = StackToStackCompositeScreenProps<
    AccountsStackParamList,
    AccountsStackRoutes.Accounts,
    RootStackParamList
>;

export const AccountsScreen = ({ navigation, route }: ScreenNavigationProps) => {
    const isAssetsFirstEnabled = useIsExperimentVariantActive({
        experimentId: ExperimentId.assetFirstHomeTable,
        variant: 'B',
    });
    const isScreenReady = useIsAccountsScreenReady();
    const networksFilter = useMemo(
        () => route.params?.networksFilter ?? [],
        [route.params?.networksFilter],
    );

    const handleSelectAccount: OnSelectAccount = ({ account }) => {
        if (
            isAssetsFirstEnabled ||
            isNetworkWithTokens(account.symbol) ||
            isStakingSymbol(account.symbol)
        ) {
            navigation.navigate(RootStackRoutes.AccountOverview, { accountKey: account.key });

            return;
        }

        navigation.navigate(RootStackRoutes.AccountDetailStack, {
            screen: AccountDetailStackRoutes.AccountDetail,
            params: { accountKey: account.key, closeActionType: 'back' },
        });
    };

    return (
        <ScreenPerformanceRoot screen="accounts" isReady={isScreenReady}>
            <Screen
                header={<DeviceManagerScreenHeader />}
                isScrollable={false}
                noHorizontalPadding
                noBottomPadding
            >
                <AccountsListWithFilter
                    title={
                        <Translation id="moduleAccountManagement.accountsScreen.accountsTitle" />
                    }
                    onSelectAccount={handleSelectAccount}
                    flowType="accounts"
                    networksFilter={networksFilter}
                    networkFilterType="accounts"
                    noHeaderPaddingTop
                >
                    <AccountsRediscoveryNeededWarning marginBottom="sp16" />
                </AccountsListWithFilter>
            </Screen>
        </ScreenPerformanceRoot>
    );
};
