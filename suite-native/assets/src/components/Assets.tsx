import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/native';

import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Card, VStack } from '@suite-native/atoms';
import {
    AppTabsParamList,
    AppTabsRoutes,
    RootStackParamList,
    RootStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { selectIsDeviceDiscoveryActive } from '@suite-common/wallet-core';

import { DiscoveryAssetsLoader } from './DiscoveryAssetsLoader';
import { selectDeviceAssetsWithBalances } from '../assetsSelectors';
import { calculateAssetsPercentage } from '../utils';
import { AssetItem } from './AssetItem';
import { NetworkAssetsBottomSheet } from './NetworkAssetsBottomSheet';

type NavigationProp = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

export const Assets = () => {
    const navigation = useNavigation<NavigationProp>();

    const deviceAssetsData = useSelector(selectDeviceAssetsWithBalances);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);

    const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<NetworkSymbol | null>(null);

    const assetsDataWithPercentage = useMemo(
        () => calculateAssetsPercentage(deviceAssetsData),
        [deviceAssetsData],
    );

    const handleSelectAssetsAccount = useCallback(
        (accountKey: AccountKey, tokenContract?: TokenAddress) => {
            navigation.navigate(RootStackRoutes.AccountDetail, {
                accountKey,
                tokenContract,
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
                            entering={isDiscoveryActive ? FadeInDown : undefined}
                            key={asset.symbol}
                        >
                            <AssetItem
                                iconName={asset.symbol}
                                cryptoCurrencyName={networks[asset.symbol].name}
                                cryptoCurrencySymbol={asset.symbol}
                                fiatBalance={asset.fiatBalance}
                                fiatPercentage={asset.fiatPercentage}
                                fiatPercentageOffset={asset.fiatPercentageOffset}
                                cryptoCurrencyValue={asset.assetBalance.toFixed()}
                                onPress={setSelectedAssetSymbol}
                            />
                        </Animated.View>
                    ))}
                    {isDiscoveryActive && (
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
