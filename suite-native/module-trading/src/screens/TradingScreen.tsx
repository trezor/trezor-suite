import { Text, VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';

import { BuyCard } from '../components/buy/BuyCard';
import { Confirmation } from '../components/buy/Confirmation';
import { PaymentCard } from '../components/buy/PaymentCard';
import { TradingFooter } from '../components/general/TradingFooter';
import { useMockedTradingInfo } from '../hooks/useMockedTradingInfo';

export const TradingScreen = () => {
    useMockedTradingInfo();

    return (
        <Screen header={<DeviceManagerScreenHeader />}>
            <VStack spacing="sp16">
                <Text variant="titleSmall" color="textDefault">
                    <Translation id="moduleTrading.tradingScreen.buyTitle" />
                </Text>
                <BuyCard />
                <PaymentCard />
                <Confirmation />
                <TradingFooter />
            </VStack>
        </Screen>
    );
};
