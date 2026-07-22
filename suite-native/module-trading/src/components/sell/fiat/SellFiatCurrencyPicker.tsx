import { useDispatch } from 'react-redux';

import type { FiatCurrencyCode } from 'invity-api';

import { useServices } from '@suite-common/dependency-injection';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { HStack } from '@suite-native/atoms';
import { sellActions } from '@suite-native/trading-state';

import { SellFiatAmountInput } from './SellFiatAmountInput';
import { SellFiatCurrencySheet } from './SellFiatCurrencySheet';
import { useSheetControls } from '../../../hooks/general/useSheetControls';
import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { FiatCurrencyButton } from '../../general/FiatCurrencyButton';

const FIAT_CURRENCY_PICKER_TEST_ID = '@trading/sell/fiat-button';

export const SellFiatCurrencyPicker = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const form = useSellFormContext();
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form, 'fiatCurrency');

    const handleFiatSelect = (fiatCurrency: FiatCurrencyCode) => {
        if (fiatCurrency === selectedValue) {
            return;
        }

        setSelectedValue(fiatCurrency);
        form.setValue('fiatStringAmount', undefined, { shouldValidate: true });
        dispatch(sellActions.fiatCurrencyChanged());
        analytics.report({
            type: events.tradingParameterChangedEvent.name,
            payload: {
                type: 'sell',
                parameter: 'fiat',
            },
        });
    };

    return (
        <>
            <HStack justifyContent="space-between" alignItems="center">
                <FiatCurrencyButton
                    currency={selectedValue}
                    onPress={showSheet}
                    testID={FIAT_CURRENCY_PICKER_TEST_ID}
                />
                <SellFiatAmountInput />
            </HStack>
            <SellFiatCurrencySheet
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onFiatSelect={handleFiatSelect}
                searchInputTestId="@trading/sell/fiat-search-input"
            />
        </>
    );
};
