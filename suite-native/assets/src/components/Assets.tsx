import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Button, Card, DashboardSection, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    AppTabsParamList,
    AppTabsRoutes,
    AccountsImportStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    TabToStackCompositeNavigationProp,
    AccountsStackRoutes,
} from '@suite-native/navigation';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { selectFiatCurrency } from '@suite-native/module-settings';
import { RootState } from '@suite-native/state';

import { AssetItem } from './AssetItem';
import { selectAssetsWithBalances } from '../assetsSelectors';

const importStyle = prepareNativeStyle(_ => ({
    marginTop: 12,
}));

type HomeAssetsNavigationProp = TabToStackCompositeNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

export const Assets = () => {
    const navigation = useNavigation<HomeAssetsNavigationProp>();
    const { applyStyle } = useNativeStyles();
    const fiatCurrency = useSelector(selectFiatCurrency);
    const assetsData = useSelector((state: RootState) =>
        selectAssetsWithBalances(state, fiatCurrency.label),
    );

    const handleImportAssets = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.XpubScan,
            params: {},
        });
    };

    const handleShowAllAccountsForAsset = (currencySymbol: NetworkSymbol) => {
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.AccountsStack,
            params: {
                screen: AccountsStackRoutes.Accounts,
                params: {
                    currencySymbol,
                },
            },
        });
    };

    return (
        <DashboardSection>
            <Card>
                <VStack spacing={19}>
                    {assetsData.map(asset => (
                        <AssetItem
                            key={asset.symbol}
                            iconName={asset.symbol}
                            cryptoCurrencyName={networks[asset.symbol].name}
                            cryptoCurrencySymbol={asset.symbol}
                            fiatBalance={asset.fiatBalance}
                            cryptoCurrencyValue={asset.assetBalance.toFixed()}
                            onPress={() => handleShowAllAccountsForAsset(asset.symbol)}
                        />
                    ))}
                </VStack>
            </Card>
            <View style={applyStyle(importStyle)}>
                <Button colorScheme="gray" size="large" onPress={handleImportAssets}>
                    Import Assets
                </Button>
            </View>
        </DashboardSection>
    );
};
