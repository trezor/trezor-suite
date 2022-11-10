import React from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { useAtom } from 'jotai';

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
    isSendReceiveActionsVisibleAtom,
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
    const [_, setIsSendReceiveVisible] = useAtom(isSendReceiveActionsVisibleAtom);
    const navigation = useNavigation<HomeAssetsNavigationProp>();
    const { applyStyle } = useNativeStyles();
    const fiatCurrency = useSelector(selectFiatCurrency);
    const assetsData = useSelector((state: RootState) =>
        selectAssetsWithBalances(state, fiatCurrency.label),
    );

    const handleReceive = () => {
        setIsSendReceiveVisible(true);
    };

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
                            onPress={() => handleShowAllAccountsForAsset(asset.symbol)}
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
