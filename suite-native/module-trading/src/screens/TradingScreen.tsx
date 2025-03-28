import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen } from '@suite-native/navigation';

import { BuyForm } from '../components/buy/BuyForm';
import { BuyFormContextProvider } from '../components/buy/BuyFormContextProvider';
import { BuyFormSkeleton } from '../components/buy/BuyFormSkeleton';
import { useTradingBuyData } from '../hooks/useTradingBuyData';

export const TradingScreen = () => {
    const { isLoading, lastLoadedTimestamp } = useTradingBuyData();

    const displaySkeleton = isLoading || lastLoadedTimestamp === 0;

    return (
        <Screen header={<DeviceManagerScreenHeader />}>
            {displaySkeleton ? (
                <BuyFormSkeleton />
            ) : (
                <BuyFormContextProvider>
                    <BuyForm />
                </BuyFormContextProvider>
            )}
        </Screen>
    );
};
