import React from 'react';
import { View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { AssetItem, Button, Card, VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { OnboardingStackRoutes } from '@suite-native/module-onboarding';
import { StackProps } from '@suite-native/navigation';

import { DashboardSection } from './DashboardSection';
import { HomeStackParamList, HomeStackRoutes } from '../navigation/routes';

const importStyle = prepareNativeStyle(_ => ({
    marginTop: 12,
}));

export const Assets = () => {
    const navigation = useNavigation<StackProps<HomeStackParamList, HomeStackRoutes.Home>>();
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
                        navigation.navigate(HomeStackRoutes.Import, {
                            screen: OnboardingStackRoutes.OnboardingXpubScan,
                        })
                    }
                >
                    Import Assets
                </Button>
            </View>
        </DashboardSection>
    );
};
