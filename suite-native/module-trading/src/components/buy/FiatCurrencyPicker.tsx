import { HStack } from '@suite-native/atoms';

import { FiatAmountInput } from './FiatAmountInput';
import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { FiatCurrencyButton } from '../general/FiatCurrencyButton';
import { FiatCurrencySheet } from '../general/FiatCurrencySheet/FiatCurrencySheet';

const FIAT_CURRENCY_PICKER_TEST_ID = '@trading/buy/fiat-button';

export const FiatCurrencyPicker = () => {
    const form = useTradingBuyFormContext();
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useTradeSheetControls(form, 'fiatCurrency');

    return (
        <>
            <HStack justifyContent="space-between" alignItems="center">
                <FiatCurrencyButton
                    currency={selectedValue}
                    onPress={showSheet}
                    testID={FIAT_CURRENCY_PICKER_TEST_ID}
                />
                <FiatAmountInput />
            </HStack>
            <FiatCurrencySheet
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onFiatSelect={setSelectedValue}
            />
        </>
    );
};
