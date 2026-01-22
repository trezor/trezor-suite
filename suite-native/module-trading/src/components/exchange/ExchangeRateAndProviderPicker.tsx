import { useSelector } from 'react-redux';

import type { ExchangeTrade } from 'invity-api';

import { selectTradingExchangeIsLoading } from '@suite-common/trading';
import { EventType } from '@suite-native/analytics';
import { useLegacyAnalytics } from '@suite-native/services';
import { selectGroupedExchangeQuotes } from '@suite-native/trading-state';

import { ExchangeProviderPicker } from './ExchangeProviderPicker';
import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { useSheetControls } from '../../hooks/general/useSheetControls';
import { ProviderSheet } from '../general/ProviderSheet/ProviderSheet';

export const ExchangeRateAndProviderPicker = () => {
    const isLoading = useSelector(selectTradingExchangeIsLoading);
    const quotes = useSelector(selectGroupedExchangeQuotes);
    const legacyAnalytics = useLegacyAnalytics();
    const form = useExchangeFormContext();

    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form, 'quote');

    if (!selectedValue && !isLoading) {
        return null;
    }

    const handleItemPress = () => {
        if (isLoading) {
            return;
        }

        showSheet();
        legacyAnalytics.report({
            type: EventType.TradingCompareOffers,
            payload: {
                type: 'exchange',
            },
        });
    };

    const handleQuoteSelect = (quote: ExchangeTrade) => {
        setSelectedValue(quote);

        if (selectedValue?.exchange === quote.exchange && selectedValue?.isDex === quote.isDex) {
            return;
        }

        legacyAnalytics.report({
            type: EventType.TradingParameterChanged,
            payload: {
                type: 'exchange',
                parameter: 'provider',
            },
        });
    };

    return (
        <>
            <ExchangeProviderPicker
                isLoading={isLoading}
                selectedValue={selectedValue}
                handleProviderPress={handleItemPress}
            />
            <ProviderSheet
                quotes={quotes}
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onQuoteSelect={handleQuoteSelect}
                selectedQuote={selectedValue}
                tradingType="exchange"
            />
        </>
    );
};
