import React from 'react';

import { Box, Button, Card, Text, VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Translation, useTranslate } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';

import { AmountCard } from '../components/buy/AmountCard';
import { TradingOverviewRow } from '../components/general/TradingOverviewRow';
import { TradingRowDivider } from '../components/general/TradingRowDivider';

const notImplementedCallback = () => {
    // eslint-disable-next-line no-console
    console.log('Not implemented');
};

export const TradingScreen = () => {
    const { translate } = useTranslate();

    return (
        <Screen header={<DeviceManagerScreenHeader />}>
            <VStack spacing="sp16">
                <Text>Trading placeholder</Text>
                <AmountCard />
                <Card noPadding>
                    <TradingRowDivider />
                    <TradingOverviewRow
                        title={translate('moduleTrading.tradingScreen.receiveAccount')}
                        onPress={notImplementedCallback}
                        noBottomBorder
                    >
                        <VStack spacing={0} paddingLeft="sp20">
                            <Text color="textSubdued" variant="body" textAlign="right">
                                Bitcoin Vault
                            </Text>
                            <Text
                                color="textSubdued"
                                variant="hint"
                                ellipsizeMode="tail"
                                numberOfLines={1}
                            >
                                3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC
                            </Text>
                        </VStack>
                    </TradingOverviewRow>
                </Card>
                <Card noPadding>
                    <TradingOverviewRow
                        title={translate('moduleTrading.tradingScreen.paymentMethod')}
                        onPress={notImplementedCallback}
                    >
                        <Text color="textSubdued" variant="body">
                            Credit card
                        </Text>
                    </TradingOverviewRow>
                    <TradingOverviewRow
                        title={translate('moduleTrading.tradingScreen.countryOfResidence')}
                        onPress={notImplementedCallback}
                    >
                        <Text color="textSubdued" variant="body">
                            Czech Republic
                        </Text>
                    </TradingOverviewRow>
                    <TradingOverviewRow
                        title={translate('moduleTrading.tradingScreen.provider')}
                        onPress={notImplementedCallback}
                    >
                        <Text color="textSubdued" variant="body">
                            Anycoin
                        </Text>
                    </TradingOverviewRow>
                    <Box padding="sp20">
                        <Button onPress={notImplementedCallback}>
                            <Translation id="moduleTrading.tradingScreen.continueButton" />
                        </Button>
                    </Box>
                </Card>
            </VStack>
        </Screen>
    );
};
