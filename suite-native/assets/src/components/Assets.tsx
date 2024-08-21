import { useCallback, useMemo, useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { calculateAssetsPercentage } from '@suite-common/assets';
import { useSelectorDeepComparison } from '@suite-common/redux-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectIsDeviceAuthorized, selectIsDeviceDiscoveryActive } from '@suite-common/wallet-core';
import { OnSelectAccount } from '@suite-native/accounts';
import { Card, VStack } from '@suite-native/atoms';
import {
    AppTabsParamList,
    AppTabsRoutes,
    RootStackParamList,
    RootStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';

import { AssetType, selectDeviceAssetsWithBalances } from '../assetsSelectors';
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

    const deviceAssetsData = useSelectorDeepComparison(selectDeviceAssetsWithBalances);

    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const isLoading = isDiscoveryActive || !isDeviceAuthorized;

    const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<NetworkSymbol | null>(null);

    const assetsDataWithPercentage = useMemo(
        () => calculateAssetsPercentage<AssetType>(deviceAssetsData),
        [deviceAssetsData],
    );

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
            <Card>
                <VStack spacing={19}>
                    {assetsDataWithPercentage.map(asset => (
                        <Animated.View
                            entering={isLoading ? FadeInDown : undefined}
                            key={asset.symbol}
                        >
                            <AssetItem
                                iconName={asset.symbol}
                                cryptoCurrencySymbol={asset.symbol}
                                fiatBalance={asset.fiatBalance}
                                fiatPercentage={asset.fiatPercentage}
                                fiatPercentageOffset={asset.fiatPercentageOffset}
                                cryptoCurrencyValue={asset.assetBalance}
                                onPress={setSelectedAssetSymbol}
                            />
                        </Animated.View>
                    ))}
                    {isLoading && (
                        <DiscoveryAssetsLoader numberOfAssets={assetsDataWithPercentage.length} />
                    )}
                </VStack>
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
