import React from 'react';
import { View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { AssetItem, Button, Card, VStack } from '@suite-native/atoms';
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
import { NetworkSymbol } from '@suite-common/wallet-config';

import { DashboardSection } from './DashboardSection';

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

    const handleImportAssets = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.XpubScan,
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
        <DashboardSection title="Assets">
            <Card>
                <VStack spacing={19}>
                    <AssetItem
                        iconName="btc"
                        cryptoCurrencyName="Bitcoin"
                        cryptoCurrencySymbol="btc"
                        cryptoCurrencyValue={0.00005122}
                        portfolioPercentage={70}
                        fiatCurrencyValue={3123}
                        onPress={() => handleShowAllAccountsForAsset('btc')}
                    />
                    <AssetItem
                        iconName="test"
                        cryptoCurrencyName="Testnet"
                        cryptoCurrencySymbol="test"
                        cryptoCurrencyValue={0.00005122}
                        portfolioPercentage={30}
                        fiatCurrencyValue={3123}
                        onPress={() => handleShowAllAccountsForAsset('test')}
                    />
                </VStack>
            </Card>
            <View style={applyStyle(importStyle)}>
                <Button colorScheme="gray" iconName="plus" onPress={handleImportAssets}>
                    Import Assets
                </Button>
            </View>
        </DashboardSection>
    );
};
