import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { BottomSheet, Card, VStack } from '@suite-native/atoms';
import { RootStackRoutes } from '@suite-native/navigation';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { AccountsListGroup } from '@suite-native/accounts';
import { AccountKey } from '@suite-common/wallet-types';

import { AssetItem } from './AssetItem';
import { selectAssetsWithBalances } from '../assetsSelectors';
import { calculateAssetsPercentage } from '../utils';

export const Assets = () => {
    const navigation = useNavigation<any>();
    const assetsData = useSelector(selectAssetsWithBalances);
    const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<NetworkSymbol | null>(null);

    const assetsDataWithPercentage = useMemo(
        () => calculateAssetsPercentage(assetsData),
        [assetsData],
    );

    const handleSelectAssetsAccount = (accountKey: AccountKey) => {
        navigation.navigate(RootStackRoutes.AccountDetail, {
            accountKey,
        });
        setSelectedAssetSymbol(null);
    };

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
                            onPress={() => setSelectedAssetSymbol(asset.symbol)}
                        />
                    ))}
                </VStack>
            </Card>
            <BottomSheet
                title="Select Account"
                isVisible={!!selectedAssetSymbol}
                onClose={() => setSelectedAssetSymbol(null)}
            >
                {selectedAssetSymbol && (
                    <AccountsListGroup
                        symbol={selectedAssetSymbol}
                        onSelectAccount={handleSelectAssetsAccount}
                    />
                )}
            </BottomSheet>
        </>
    );
};
