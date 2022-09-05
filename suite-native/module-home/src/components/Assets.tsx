import React from 'react';
import { View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { AssetsStackRoutes } from '@suite-native/module-assets';
import { AssetItem, Button, Card, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { CompositeTabToStackNavigationProp } from '@suite-native/navigation';

import { DashboardSection } from './DashboardSection';

const importStyle = prepareNativeStyle(_ => ({
    marginTop: 12,
}));

type HomeAssetsNavigationProp = CompositeTabToStackNavigationProp<
    AppTabsParamList,
    AppTabsRoutes.HomeStack,
    RootStackParamList
>;

export const Assets = () => {
    const navigation = useNavigation<HomeAssetsNavigationProp>();
    const { applyStyle } = useNativeStyles();

    return (
        <DashboardSection title="Assets">
            <Card>
                <VStack spacing={19}>
                    <AssetItem
                        iconName="btc"
                        cryptoCurrencyName="Bitcoin"
                        cryptoCurrencySymbol="BTC"
                        cryptoCurrencyValue={0.00005122}
                        portfolioPercentage={70}
                        fiatCurrencyValue={3123}
                    />
                    <AssetItem
                        iconName="eth"
                        cryptoCurrencyName="Ethereum"
                        cryptoCurrencySymbol="ETH"
                        cryptoCurrencyValue={0.00005122}
                        portfolioPercentage={30}
                        fiatCurrencyValue={3123}
                    />
                </VStack>
            </Card>
            <View style={applyStyle(importStyle)}>
                <Button
                    colorScheme="gray"
                    iconName="plus"
                    onPress={() =>
                        navigation.navigate(RootStackRoutes.Assets, {
                            screen: AssetsStackRoutes.XpubScan,
                        })
                    }
                >
                    Import Assets
                </Button>
            </View>
        </DashboardSection>
    );
};
