import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNetInfo } from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';

import { Context } from '@suite-common/message-system';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { ContextMessage } from '@suite-native/message-system';
import { Screen, TradingStackRoutes } from '@suite-native/navigation';

import { BuyForm } from '../components/buy/BuyForm';
import { BuyFormContextProvider } from '../components/buy/BuyFormContextProvider';
import { BuyFormSkeleton } from '../components/buy/BuyFormSkeleton';
import { DeviceOffline } from '../components/general/Offline/DeviceOffline';
import { ServerOffline } from '../components/general/Offline/ServerOffline';
import { NavigationProps } from '../components/general/TradeHistory/TradeHistoryButton';
import { useTradingBuyData } from '../hooks/useTradingBuyData';
import { selectIsTradingBuyEnabled, selectTradeToBeOpened } from '../selectors/commonSelectors';

const TradingScreenContent = () => {
    const [reloadOrdinal, setReloadOrdinal] = useState(0);
    const { isLoading, lastLoadedTimestamp, isFullyLoaded } = useTradingBuyData(reloadOrdinal);
    const { isInternetReachable } = useNetInfo();
    const tradeToBeOpened = useSelector(selectTradeToBeOpened);
    const navigation = useNavigation<NavigationProps>();

    useEffect(() => {
        if (tradeToBeOpened) {
            navigation.navigate(TradingStackRoutes.TradeHistory, {
                tradeType: tradeToBeOpened.tradeType,
            });
        }
    }, [tradeToBeOpened, navigation]);

    if (isInternetReachable === false) {
        return <DeviceOffline />;
    }

    const isLoadingFinished = !isLoading && lastLoadedTimestamp > 0;
    if (isLoadingFinished && !isFullyLoaded) {
        return <ServerOffline onRetryPress={() => setReloadOrdinal(reloadOrdinal + 1)} />;
    }

    return (
        <>
            <ContextMessage context={Context.tradingBuy} />
            {isFullyLoaded ? (
                <BuyFormContextProvider>
                    <BuyForm />
                </BuyFormContextProvider>
            ) : (
                <BuyFormSkeleton />
            )}
        </>
    );
};

export const TradingScreen = () => {
    const isTradingBuyEnabled = useSelector(selectIsTradingBuyEnabled);

    if (!isTradingBuyEnabled) {
        return null;
    }

    return (
        <Screen header={<DeviceManagerScreenHeader />}>
            <TradingScreenContent />
        </Screen>
    );
};
