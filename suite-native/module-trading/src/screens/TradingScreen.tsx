import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Context } from '@suite-common/message-system';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { ContextMessage } from '@suite-native/message-system';
import { Screen, TradingStackRoutes } from '@suite-native/navigation';

import { BuyForm } from '../components/buy/BuyForm';
import { BuyFormContextProvider } from '../components/buy/BuyFormContextProvider';
import { BuyFormSkeleton } from '../components/buy/BuyFormSkeleton';
import { NavigationProps } from '../components/general/TradeHistory/TradeHistoryButton';
import { useTradingBuyData } from '../hooks/useTradingBuyData';
import { selectIsTradingBuyEnabled, selectTradeToBeOpened } from '../selectors/commonSelectors';

export const TradingScreen = () => {
    const isTradingBuyEnabled = useSelector(selectIsTradingBuyEnabled);
    const { isLoading, lastLoadedTimestamp } = useTradingBuyData();
    const tradeToBeOpened = useSelector(selectTradeToBeOpened);
    const navigation = useNavigation<NavigationProps>();

    const displaySkeleton = isLoading || lastLoadedTimestamp === 0;

    useEffect(() => {
        if (tradeToBeOpened) {
            navigation.navigate(TradingStackRoutes.TradeHistory, {
                tradeType: tradeToBeOpened.tradeType,
            });
        }
    }, [tradeToBeOpened, navigation]);

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
