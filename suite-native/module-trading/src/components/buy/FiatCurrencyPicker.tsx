import { Box, HStack } from '@suite-native/atoms';

import { BuyFormFieldErrorBadge } from './BuyFormFieldErrorBadge';
import { FiatAmountInput } from './FiatAmountInput';
import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';
import { FiatCurrencyButton } from '../general/FiatCurrencyButton';
import { FiatCurrencySheet } from '../general/FiatCurrencySheet/FiatCurrencySheet';

export const FiatCurrencyPicker = () => {
    const form = useTradingBuyFormContext();
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useTradeSheetControls(form, 'fiatCurrency');

    return (
        <>
            <HStack justifyContent="space-between" alignItems="center">
                <FiatCurrencyButton currency={selectedValue} onPress={showSheet} />
                <FiatAmountInput />
            </HStack>
            <Box alignItems="flex-end">
                <BuyFormFieldErrorBadge fieldName="fiatValue" />
            </Box>
            <FiatCurrencySheet
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onFiatSelect={setSelectedValue}
            />
        </>
    );
};
