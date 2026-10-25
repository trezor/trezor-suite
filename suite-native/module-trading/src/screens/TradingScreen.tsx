import { useEffect } from 'react';
import { type EdgeInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { VStack, useBannerAwareSafeAreaInsets } from '@suite-native/atoms';
import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { RootStackRoutes, Screen } from '@suite-native/navigation';
import { TradingEnvironmentWarning } from '@suite-native/trading-debug';
import { Footer } from '@suite-native/trading-provider-utils';
import {
    selectHasActiveTradingType,
    selectIsTradingEnabled,
    selectTradeToBeOpened,
} from '@suite-native/trading-state';
import { useServices } from '@trezor/dependency-injection';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TRADING_KEYBOARD_TOOLBAR_HOST } from '../components/general/CryptoAmountKeyboardToolbar';
import { Header } from '../components/general/Header/Header';
import { HistoryButton, type NavigationProps } from '../components/general/HistoryButton';
import { LegalGatewayContextMessage } from '../components/general/LegalGatewayContextMessage';
import { TradingTabContent } from '../components/general/TradingTabContent';
import { TradingTypeAwareContextMessage } from '../components/general/TradingTypeAwareContextMessage';
import { useActiveTradingTypeReaction } from '../hooks/general/useActiveTradingTypeReaction';

const tradingContentStyle = prepareNativeStyle<{ insets: EdgeInsets }>((utils, { insets }) => ({
    // Screen already applies the safe-area insets; add only the remaining page spacing.
    paddingLeft: Math.max(utils.spacings.sp16 - insets.left, 0),
    paddingRight: Math.max(utils.spacings.sp16 - insets.right, 0),
}));

const useTradingContentStyle = () => {
    const insets = useBannerAwareSafeAreaInsets();
    const { applyStyle } = useNativeStyles();

    return applyStyle(tradingContentStyle, { insets });
};

const TradingScreenContent = () => {
    const contentStyle = useTradingContentStyle();
    const tradeToBeOpened = useSelector(selectTradeToBeOpened);
    const hasActiveTradingType = useSelector(selectHasActiveTradingType);
    const navigation = useNavigation<NavigationProps>();
    useActiveTradingTypeReaction();
    const { analytics } = useServices(injectNativeAnalytics);

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
            <VStack spacing="sp16" style={contentStyle} flex={1}>
                <TradingTabContent />
                <HistoryButton />
                <Footer />
            </VStack>
        </VStack>
    );
};

export const TradingScreen = () => {
    const contentStyle = useTradingContentStyle();
    const isTradingEnabled = useSelector(selectIsTradingEnabled);

    if (!isTradingEnabled) {
        return null;
    }

    return (
        <Screen
            keyboardToolbarHostName={TRADING_KEYBOARD_TOOLBAR_HOST}
            noHorizontalPadding
            header={
                <>
                    <DeviceManagerScreenHeader />
                    <TradingTypeAwareContextMessage marginHorizontal="sp16" marginBottom="sp16" />
                </>
            }
        >
            <TradingScreenContent />
            <LegalGatewayContextMessage marginVertical="sp16" style={contentStyle} />
        </Screen>
    );
};
