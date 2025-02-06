import { Button, Text, VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';

import { BuyCard } from '../components/buy/BuyCard';
import { PaymentCard } from '../components/buy/PaymentCard';
import { TradingFooter } from '../components/general/TradingFooter';

const notImplementedCallback = () => {
    // eslint-disable-next-line no-console
    console.log('Not implemented');
};

export const TradingScreen = () => (
    <Screen header={<DeviceManagerScreenHeader />}>
        <VStack spacing="sp16">
            <Text variant="titleSmall" color="textDefault">
                <Translation id="moduleTrading.tradingScreen.buyTitle" />
            </Text>
            <BuyCard />
            <PaymentCard />
            <Button onPress={notImplementedCallback}>
                <Translation id="moduleTrading.tradingScreen.continueButton" />
            </Button>
            <TradingFooter />
        </VStack>
    </Screen>
);
