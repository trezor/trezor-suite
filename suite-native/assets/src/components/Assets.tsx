import { useCallback, useState } from 'react';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceAuthorized } from '@suite-common/device';
import { useSelectorDeepComparison } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { type OnSelectAccount } from '@suite-native/accounts';
import { AnimatedContainerCard } from '@suite-native/atoms';
import { AccountsRediscoveryNeededWarning } from '@suite-native/discovery';
import { FiveBinariesHomeBanner, useStakingDetailNavigation } from '@suite-native/module-earn';
import {
    type AppTabsParamList,
    type AppTabsRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';

import { selectDeviceNetworksWithAssets } from '../assetsSelectors';
import { AssetItem } from './AssetItem';
import { DiscoveryAssetsLoader } from './DiscoveryAssetsLoader';
import { NetworkAssetsBottomSheet } from './NetworkAssetsBottomSheet';

type NavigationProp = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

export const Assets = () => {
    const navigation = useNavigation<NavigationProp>();
    const { navigateToStakingDetail } = useStakingDetailNavigation();
    const deviceNetworks = useSelectorDeepComparison(selectDeviceNetworksWithAssets);

    const hasDiscovery = useSelector(selectHasRunningDiscovery);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isLoading = hasDiscovery || !isDeviceAuthorized;

    const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<NetworkSymbol | null>(null);

    const handleSelectAssetsAccount: OnSelectAccount = useCallback(
        ({ account, tokenAddress, isStaking }) => {
            if (isStaking) {
                navigateToStakingDetail({
                    accountKey: account.key,
                    symbol: account.symbol,
                });
            } else {
                navigation.navigate(RootStackRoutes.AccountDetail, {
                    accountKey: account.key,
                    tokenContract: tokenAddress,
                    closeActionType: 'back',
                });
            }
            setSelectedAssetSymbol(null);
        },
        [navigateToStakingDetail, navigation],
    );

    const handleCloseBottomSheet = useCallback(() => {
        setSelectedAssetSymbol(null);
    }, [setSelectedAssetSymbol]);

    return (
        <>
            <FiveBinariesHomeBanner />
            <AnimatedContainerCard noPadding layout={LinearTransition}>
                <AccountsRediscoveryNeededWarning hasPadding />
                {deviceNetworks.map(symbol => (
                    <Animated.View
                        entering={isLoading ? FadeInDown : undefined}
                        layout={LinearTransition}
                        key={symbol}
                    >
                        <AssetItem cryptoCurrencySymbol={symbol} onPress={setSelectedAssetSymbol} />
                    </Animated.View>
                ))}
                {isLoading && <DiscoveryAssetsLoader isListEmpty={deviceNetworks.length < 1} />}
            </AnimatedContainerCard>
            <NetworkAssetsBottomSheet
                symbol={selectedAssetSymbol}
                onSelectAccount={handleSelectAssetsAccount}
                onClose={handleCloseBottomSheet}
            />
        </>
    );
};
