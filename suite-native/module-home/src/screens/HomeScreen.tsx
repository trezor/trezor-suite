import React from 'react';

import { AssetItem, Box, Button } from '@suite-native/atoms';
import { StackProps, Screen } from '@suite-native/navigation';

import { HomeStackParamList, HomeStackRoutes } from '../navigation/routes';

export const HomeScreen = ({
    navigation,
}: StackProps<HomeStackParamList, HomeStackRoutes.Home>) => (
    <Screen>
        <Box padding="medium">
            <Button
                onPress={() =>
                    navigation.navigate(HomeStackRoutes.HomeDemo, {
                        message: 'Component Demo',
                    })
                }
            >
                See Component Demo
            </Button>
            <Box marginVertical="small" />
            <Box style={{ backgroundColor: 'white' }}>
                <AssetItem
                    iconName="btc"
                    cryptoCurrencyName="Bitcoin"
                    cryptoCurrencySymbol="BTC"
                    cryptoCurrencyValue={0.00005122}
                    portfolioPercentage={60}
                    fiatCurrencyValue={3123}
                />
            </Box>
        </Box>
    </Screen>
);
