import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Card, VStack } from '@suite-native/atoms';
import {
    AppTabsParamList,
    AppTabsRoutes,
    RootStackParamList,
    RootStackRoutes,
    TabToStackCompositeNavigationProp,
} from '@suite-native/navigation';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';

import { AssetItem } from './AssetItem';
import { selectAssetsWithBalances } from '../assetsSelectors';
import { calculateAssetsPercentage } from '../utils';
import { NetworkAssetsBottomSheet } from './NetworkAssetsBottomSheet';

export const Assets = () => {
    const navigation =
        useNavigation<
            TabToStackCompositeNavigationProp<
                AppTabsParamList,
                AppTabsRoutes.HomeStack,
                RootStackParamList
            >
        >();
    const assetsData = useSelector(selectAssetsWithBalances);
    const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<NetworkSymbol | null>(null);

    const assetsDataWithPercentage = useMemo(
        () => calculateAssetsPercentage(assetsData),
        [assetsData],
    );

    const handleSelectAssetsAccount = useCallback(
        (accountKey: AccountKey, tokenContract?: TokenAddress) => {
            navigation.navigate(RootStackRoutes.AccountDetail, {
                accountKey,
                tokenContract,
            });
            setSelectedAssetSymbol(null);
        },
        [navigation],
    );

    const handleCloseBottomSheet = useCallback(() => {
        setSelectedAssetSymbol(null);
    }, []);

    return (
        <>
            <Card>
                <VStack spacing={19}>
                    {assetsDataWithPercentage.map(asset => (
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
                </VStack>
            </Card>
            <NetworkAssetsBottomSheet
                networkSymbol={selectedAssetSymbol}
                onSelectAccount={handleSelectAssetsAccount}
                onClose={handleCloseBottomSheet}
            />
        </>
    );
};
