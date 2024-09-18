import { useCallback, useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useSelectorDeepComparison } from '@suite-common/redux-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectIsDeviceAuthorized, selectHasDeviceDiscovery } from '@suite-common/wallet-core';
import { OnSelectAccount } from '@suite-native/accounts';
import { Card } from '@suite-native/atoms';
import {
    AppTabsParamList,
    AppTabsRoutes,
    RootStackParamList,
    RootStackRoutes,
    TabToStackCompositeNavigationProp,
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

    const deviceNetworks = useSelectorDeepComparison(selectDeviceNetworksWithAssets);

    const hasDiscovery = useSelector(selectHasDeviceDiscovery);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isLoading = hasDiscovery || !isDeviceAuthorized;

    const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<NetworkSymbol | null>(null);

    const handleSelectAssetsAccount: OnSelectAccount = useCallback(
        ({ account, tokenAddress }) => {
            navigation.navigate(RootStackRoutes.AccountDetail, {
                accountKey: account.key,
                tokenContract: tokenAddress,
                closeActionType: 'back',
            });
            setSelectedAssetSymbol(null);
        },
        [navigation, setSelectedAssetSymbol],
    );

    const handleCloseBottomSheet = useCallback(() => {
        setSelectedAssetSymbol(null);
    }, [setSelectedAssetSymbol]);

    return (
        <>
            <Card noPadding>
                {deviceNetworks.map(networkSymbol => (
                    <Animated.View
                        entering={isLoading ? FadeInDown : undefined}
                        key={networkSymbol}
                    >
                        <AssetItem
                            cryptoCurrencySymbol={networkSymbol}
                            onPress={setSelectedAssetSymbol}
                        />
                    </Animated.View>
                ))}
                {isLoading && <DiscoveryAssetsLoader isListEmpty={deviceNetworks.length < 1} />}
            </Card>
            {selectedAssetSymbol && (
                <NetworkAssetsBottomSheet
                    networkSymbol={selectedAssetSymbol}
                    onSelectAccount={handleSelectAssetsAccount}
                    onClose={handleCloseBottomSheet}
                />
            )}
        </>
    );
};
