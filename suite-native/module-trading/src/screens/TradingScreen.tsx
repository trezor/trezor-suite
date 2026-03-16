import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-native/analytics';
import { VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen, TradingStackRoutes } from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { TradingEnvironmentWarning } from '@suite-native/trading-debug';
import {
    selectActiveTradingType,
    selectIsTradingEnabled,
    selectTradeToBeOpened,
} from '@suite-native/trading-state';

import { Footer } from '../components/general/Footer';
import { Header } from '../components/general/Header/Header';
import { HistoryButton, type NavigationProps } from '../components/general/HistoryButton';
import { LegalGatewayContextMessage } from '../components/general/LegalGatewayContextMessage';
import { TradingTabContent } from '../components/general/TradingTabContent';
import { TradingTypeAwareContextMessage } from '../components/general/TradingTypeAwareContextMessage';
import { useActiveTradingTypeReaction } from '../hooks/general/useActiveTradingTypeReaction';
import { useMountedRecentlyFlag } from '../hooks/general/useMountedRecentlyFlag';

const TradingScreenContent = () => {
    const tradeToBeOpened = useSelector(selectTradeToBeOpened);
    const activeTradingType = useSelector(selectActiveTradingType);
    const navigation = useNavigation<NavigationProps>();
    const isScreenMountedRecently = useMountedRecentlyFlag(activeTradingType);
    useActiveTradingTypeReaction();
    const analytics = useAnalytics();
    useEffect(() => {
        if (tradeToBeOpened) {
            analytics.report({
                type: events.tradingSuccessEvent.name,
                payload: { type: tradeToBeOpened.tradeType },
            });
            navigation.navigate(TradingStackRoutes.TradingHistory);
        }
    }, [tradeToBeOpened, navigation, analytics]);

    if (!activeTradingType) {
        return null;
    }

    return (
        <VStack spacing="sp16">
            <TradingEnvironmentWarning />
            <Header isFormMountedRecently={isScreenMountedRecently} />
            <TradingTabContent />
            <HistoryButton isFormMountedRecently={isScreenMountedRecently} />
            <Footer isFormMountedRecently={isScreenMountedRecently} />
        </VStack>
    );
};

export const TradingScreen = () => {
    const isTradingEnabled = useSelector(selectIsTradingEnabled);

    if (!isTradingEnabled) {
        return null;
    }

    return (
        <Screen
            header={
                <>
                    <DeviceManagerScreenHeader />
                    <TradingTypeAwareContextMessage marginHorizontal="sp16" marginBottom="sp16" />
                </>
            }
        >
            <TradingScreenContent />
            <LegalGatewayContextMessage marginVertical="sp16" />
        </Screen>
    );
};
