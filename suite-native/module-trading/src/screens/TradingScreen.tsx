import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNetInfo } from '@react-native-community/netinfo';
import { useNavigation } from '@react-navigation/native';

import { EventType, analytics } from '@suite-native/analytics';
import { VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen, TradingStackRoutes } from '@suite-native/navigation';

import { ActiveTab } from '../components/general/ActiveTab';
import { DeviceOffline } from '../components/general/Error/DeviceOffline';
import { Footer } from '../components/general/Footer';
import { Header } from '../components/general/Header/Header';
import { HistoryButton, NavigationProps } from '../components/general/HistoryButton';
import { TradingTypeAwareContextMessage } from '../components/general/TradingTypeAwareContextMessage';
import { useActiveTradingTypeReaction } from '../hooks/general/useActiveTradingTypeReaction';
import { useMountedRecentlyFlag } from '../hooks/general/useMountedRecentlyFlag';
import {
    selectActiveTradingType,
    selectIsTradingEnabled,
    selectTradeToBeOpened,
} from '../selectors/commonSelectors';

const TradingScreenContent = () => {
    const { isInternetReachable } = useNetInfo();
    const tradeToBeOpened = useSelector(selectTradeToBeOpened);
    const activeTradingType = useSelector(selectActiveTradingType);
    const navigation = useNavigation<NavigationProps>();
    const isScreenMountedRecently = useMountedRecentlyFlag(activeTradingType);
    useActiveTradingTypeReaction();

    useEffect(() => {
        if (tradeToBeOpened) {
            analytics.report({
                type: EventType.TradingSuccess,
                payload: { type: tradeToBeOpened.tradeType },
            });
            navigation.navigate(TradingStackRoutes.TradingHistory);
        }
    }, [tradeToBeOpened, navigation]);

    if (!activeTradingType) {
        return null;
    }

    return (
        <>
            <TradingTypeAwareContextMessage />
            <VStack spacing="sp16">
                <Header isFormMountedRecently={isScreenMountedRecently} />
                {isInternetReachable === false ? <DeviceOffline /> : <ActiveTab />}
                <Footer isFormMountedRecently={isScreenMountedRecently} />
                <HistoryButton isFormMountedRecently={isScreenMountedRecently} />
            </VStack>
        </>
    );
};

export const TradingScreen = () => {
    const isTradingEnabled = useSelector(selectIsTradingEnabled);

    if (!isTradingEnabled) {
        return null;
    }

    return (
        <Screen header={<DeviceManagerScreenHeader />}>
            <TradingScreenContent />
        </Screen>
    );
};
