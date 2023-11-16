import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Card, VStack, TextButton } from '@suite-native/atoms';
import {
    AccountsStackRoutes,
    AppTabsParamList,
    AppTabsRoutes,
    RootStackParamList,
    RootStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { selectIsDeviceDiscoveryActive } from '@suite-common/wallet-core';
import { useTranslate } from '@suite-native/intl';

import { DiscoveryAssetsLoader } from './DiscoveryAssetsLoader';
import { selectAssetsWithBalances } from '../assetsSelectors';
import { calculateAssetsPercentage } from '../utils';
import { AssetItem } from './AssetItem';
import { NetworkAssetsBottomSheet } from './NetworkAssetsBottomSheet';

type NavigationProp = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

type AssetsProps = {
    maximumAssetsVisible: number;
};

export const Assets = ({ maximumAssetsVisible }: AssetsProps) => {
    const navigation = useNavigation<NavigationProp>();

    const { translate } = useTranslate();

    const assetsData = useSelector(selectAssetsWithBalances);
    const isDiscoveryActive = useSelector(selectIsDeviceDiscoveryActive);

    const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<NetworkSymbol | null>(null);

    const assetsDataWithPercentage = useMemo(
        () => calculateAssetsPercentage(assetsData),
        [assetsData],
    );

    const navigateToAssets = () => {
        navigation.navigate(AppTabsRoutes.AccountsStack, { screen: AccountsStackRoutes.Accounts });
    };

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

    const isViewMoreButtonVisible = assetsDataWithPercentage.length > maximumAssetsVisible;

    return (
        <>
            <Card>
                <VStack spacing={19}>
                    {assetsDataWithPercentage.slice(0, maximumAssetsVisible).map(asset => (
                        <AssetItem
                            key={asset.symbol}
                            iconName={asset.symbol}
                            cryptoCurrencyName={networks[asset.symbol].name}
                            cryptoCurrencySymbol={asset.symbol}
                            fiatBalance={asset.fiatBalance}
                            fiatPercentage={asset.fiatPercentage}
                            fiatPercentageOffset={asset.fiatPercentageOffset}
                            cryptoCurrencyValue={asset.assetBalance.toFixed()}
                            onPress={setSelectedAssetSymbol}
                        />
                    ))}
                    {isDiscoveryActive && (
                        <DiscoveryAssetsLoader emptyListSkeletonCount={maximumAssetsVisible} />
                    )}
                    {isViewMoreButtonVisible && (
                        <TextButton variant="tertiary" isUnderlined onPress={navigateToAssets}>
                            {translate('assets.dashboard.viewAllAssets')}
                        </TextButton>
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
