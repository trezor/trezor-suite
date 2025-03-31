import { useSelector } from 'react-redux';

import { Context } from '@suite-common/message-system';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { ContextMessage } from '@suite-native/message-system';
import { Screen } from '@suite-native/navigation';

import { BuyForm } from '../components/buy/BuyForm';
import { BuyFormContextProvider } from '../components/buy/BuyFormContextProvider';
import { BuyFormSkeleton } from '../components/buy/BuyFormSkeleton';
import { useTradingBuyData } from '../hooks/useTradingBuyData';
import { selectIsTradingBuyEnabled } from '../selectors/commonSelectors';

export const TradingScreen = () => {
    const isTradingBuyEnabled = useSelector(selectIsTradingBuyEnabled);
    const { isLoading, lastLoadedTimestamp } = useTradingBuyData();

    const displaySkeleton = isLoading || lastLoadedTimestamp === 0;

    return (
        <Screen header={<DeviceManagerScreenHeader />}>
            {isTradingBuyEnabled && (
                <>
                    <ContextMessage context={Context.tradingBuy} />
                    {displaySkeleton ? (
                        <BuyFormSkeleton />
                    ) : (
                        <BuyFormContextProvider>
                            <BuyForm />
                        </BuyFormContextProvider>
                    )}
                </>
            )}
        </Screen>
    );
};
