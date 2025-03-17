import { Text, VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Translation } from '@suite-native/intl';
import { Screen } from '@suite-native/navigation';

import { BuyForm } from '../components/buy/BuyForm';
import { BuyFormSkeleton } from '../components/buy/BuyFormSkeleton';
import { TradingFooter } from '../components/general/TradingFooter';
import { useTradingBuyData } from '../hooks/useTradingBuyData';

export const TradingScreen = () => {
    const { isLoading, lastLoadedTimestamp } = useTradingBuyData();

    const displaySkeleton = isLoading || lastLoadedTimestamp === 0;

    return (
        <Screen header={<DeviceManagerScreenHeader />}>
            <VStack spacing="sp16">
                <Text variant="titleSmall" color="textDefault">
                    <Translation id="moduleTrading.tradingScreen.buyTitle" />
                </Text>
                {displaySkeleton ? <BuyFormSkeleton /> : <BuyForm />}
                <TradingFooter />
            </VStack>
        </Screen>
    );
};
