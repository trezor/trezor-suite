import React from 'react';

import { AssetItem, Card, VStack } from '@suite-native/atoms';

import { DashboardSection } from './DashboardSection';

export const Assets = () => (
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
    </DashboardSection>
);
