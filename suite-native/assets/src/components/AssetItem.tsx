import { memo, useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    AccountsListItemBase,
    type NativeAccountsRootState,
    selectHasDeviceAnyFailedAccountForNetworkSymbol,
} from '@suite-native/accounts';
import { Icon } from '@suite-native/icons';
import {
    AccountsStackRoutes,
    type AppTabsParamList,
    AppTabsRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { selectHasDeviceAnyTokensForNetwork, type TokensRootState } from '@suite-native/tokens';

import {
    selectHasAnyDeviceAccountsWithStaking,
    StakeRootState,
    TronStakeRootState,
} from '@suite-common/wallet-core';
import { selectSingleDeviceAccountKeyForNetworkSymbol } from '../assetsSelectors';
import { type AssetsRootState } from '../types';
import { AssetItemBadges } from './AssetItemBadges';
import { AssetItemTitle } from './AssetItemTitle';
import { CryptoAmount } from './CryptoAmount';
import { FiatAmount } from './FiatAmount';
import { PercentageIcon } from './PercentageIcon';

type AssetItemProps = {
    cryptoCurrencySymbol: NetworkSymbol;
};

type NavigationType = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

export const AssetItem = memo(({ cryptoCurrencySymbol }: AssetItemProps) => {
    const navigation = useNavigation<NavigationType>();
    const singleAccountKey = useSelector((state: AssetsRootState) =>
        selectSingleDeviceAccountKeyForNetworkSymbol(state, cryptoCurrencySymbol),
    );
    const hasAnyTokens = useSelector((state: TokensRootState) =>
        selectHasDeviceAnyTokensForNetwork(state, cryptoCurrencySymbol),
    );
    const hasAnyAccountsWithStaking = useSelector((state: StakeRootState & TronStakeRootState) =>
        selectHasAnyDeviceAccountsWithStaking(state, cryptoCurrencySymbol),
    );
    const hasAnyFailedAccount = useSelector((state: NativeAccountsRootState) =>
        selectHasDeviceAnyFailedAccountForNetworkSymbol(state, cryptoCurrencySymbol),
    );

    const secondaryValue = hasAnyFailedAccount ? undefined : (
        <CryptoAmount symbol={cryptoCurrencySymbol} />
    );

    const handleAssetPress = useCallback(() => {
        // A single tokenless account opens its detail directly; anything else opens the list.
        if (singleAccountKey && !hasAnyTokens && !hasAnyAccountsWithStaking) {
            navigation.navigate(RootStackRoutes.AccountDetail, {
                accountKey: singleAccountKey,
                closeActionType: 'back',
            });

            return;
        }

        navigation.navigate(AppTabsRoutes.AccountsStack, {
            screen: AccountsStackRoutes.Accounts,
            params: { networksFilter: [cryptoCurrencySymbol] },
        });
    }, [
        cryptoCurrencySymbol,
        hasAnyAccountsWithStaking,
        hasAnyTokens,
        navigation,
        singleAccountKey,
    ]);

    return (
        <AccountsListItemBase
            onPress={handleAssetPress}
            icon={<PercentageIcon symbol={cryptoCurrencySymbol} />}
            title={<AssetItemTitle symbol={cryptoCurrencySymbol} />}
            badges={<AssetItemBadges symbol={cryptoCurrencySymbol} />}
            mainValue={
                hasAnyFailedAccount ? (
                    <Icon name="warning" color="contentWarning" size="medium" />
                ) : (
                    <FiatAmount symbol={cryptoCurrencySymbol} />
                )
            }
            secondaryValue={secondaryValue}
        />
    );
});

AssetItem.displayName = 'AssetItem';
