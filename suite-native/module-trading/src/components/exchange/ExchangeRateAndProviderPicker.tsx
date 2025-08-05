import { useSelector } from 'react-redux';

import { ExchangeTrade } from 'invity-api';

import {
    selectTradingExchangeIsLoading,
    selectTradingExchangeProviders,
} from '@suite-common/trading';

import { ExchangeProviderPicker } from './ExchangeProviderPicker';
import { ExchangeRatePicker } from './ExchangeRatePicker';
import { useExchangeFormContext } from '../../hooks/exchange/useExchangeFormContext';
import { useSheetControls } from '../../hooks/general/useSheetControls';
import { selectGroupedExchangeQuotes } from '../../selectors/exchangeSelectors';
import { ProviderSheet } from '../general/ProviderSheet/ProviderSheet';

export const ExchangeRateAndProviderPicker = () => {
    const isLoading = useSelector(selectTradingExchangeIsLoading);
    const providers = useSelector(selectTradingExchangeProviders);
    const quotes = useSelector(selectGroupedExchangeQuotes);

    const form = useExchangeFormContext();

    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form, 'quote');

    if (!selectedValue && !isLoading) {
        return null;
    }

    const handleItemPress = () => {
        if (!isLoading) {
            showSheet();
        }
    };

    const handleQuoteSelect = (quote: ExchangeTrade) => {
        setSelectedValue(quote);
        // TODO analytics
    };

    return (
        <>
            <ExchangeRatePicker
                isLoading={isLoading}
                selectedValue={selectedValue}
                handleRatePress={handleItemPress}
            />
            <ExchangeProviderPicker
                isLoading={isLoading}
                selectedValue={selectedValue}
                handleProviderPress={handleItemPress}
            />
            <ProviderSheet<ExchangeTrade>
                quotes={quotes}
                providerInfos={providers ?? {}}
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onQuoteSelect={handleQuoteSelect}
                selectedQuote={selectedValue}
            />
        </>
    );
};
