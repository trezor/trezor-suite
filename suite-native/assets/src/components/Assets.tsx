import React from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Button, Card, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    AppTabsParamList,
    AppTabsRoutes,
    AccountsImportStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    TabToStackCompositeNavigationProp,
    AccountsStackRoutes,
    HomeStackRoutes,
} from '@suite-native/navigation';
import { networks } from '@suite-common/wallet-config';
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

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveModal, {});
    };

    const handleImportAssets = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
            params: {
                origin: HomeStackRoutes.Home,
            },
        });
    };

    const handleShowAssetsAccounts = () => {
        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.AccountsStack,
            params: {
                screen: AccountsStackRoutes.Accounts,
            },
        });
    };

    return (
        <>
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
                            onPress={handleShowAssetsAccounts}
                        />
                    ))}
                </VStack>
            </Card>
            <VStack style={applyStyle(importStyle)} spacing="small">
                <Button colorScheme="gray" size="large" onPress={handleImportAssets}>
                    Import Assets
                </Button>
                <Button size="large" onPress={handleReceive}>
                    Receive
                </Button>
            </VStack>
        </>
    );
};
