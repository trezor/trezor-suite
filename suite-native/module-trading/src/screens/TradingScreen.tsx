import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { VStack } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { RootStackRoutes, Screen } from '@suite-native/navigation';
import { TradingEnvironmentWarning } from '@suite-native/trading-debug';
import { Footer } from '@suite-native/trading-provider-utils';
import {
    selectHasActiveTradingType,
    selectIsTradingEnabled,
    selectTradeToBeOpened,
} from '@suite-native/trading-state';

import { Header } from '../components/general/Header/Header';
import { HistoryButton, type NavigationProps } from '../components/general/HistoryButton';
import { LegalGatewayContextMessage } from '../components/general/LegalGatewayContextMessage';
import { TradingTabContent } from '../components/general/TradingTabContent';
import { TradingTypeAwareContextMessage } from '../components/general/TradingTypeAwareContextMessage';
import { useActiveTradingTypeReaction } from '../hooks/general/useActiveTradingTypeReaction';

const TradingScreenContent = () => {
    const tradeToBeOpened = useSelector(selectTradeToBeOpened);
    const hasActiveTradingType = useSelector(selectHasActiveTradingType);
    const navigation = useNavigation<NavigationProps>();
    useActiveTradingTypeReaction();
    const { analytics } = useServices(selectNativeAnalyticsDep);

    useEffect(() => {
        if (tradeToBeOpened) {
            analytics.report({
                type: events.tradingSuccessEvent.name,
                payload: { type: tradeToBeOpened.tradeType },
            });
            navigation.navigate(RootStackRoutes.TradingHistory);
        }
    }, [tradeToBeOpened, navigation, analytics]);

    if (!hasActiveTradingType) {
        return null;
    }

    return (
        <VStack spacing="sp16" flex={1}>
            <TradingEnvironmentWarning />
            <Header />
            <VStack spacing="sp16" paddingHorizontal="sp16" flex={1}>
                <TradingTabContent />
                <HistoryButton />
                <Footer />
            </VStack>
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
            noHorizontalPadding
            header={
                <>
                    <DeviceManagerScreenHeader />
                    <TradingTypeAwareContextMessage marginHorizontal="sp16" marginBottom="sp16" />
                </>
            }
        >
            <TradingScreenContent />
            <LegalGatewayContextMessage marginVertical="sp16" paddingHorizontal="sp16" />
        </Screen>
    );
};
