import { HStack } from '@suite-native/atoms';

import { BuyFiatAmountInput } from './BuyFiatAmountInput';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useSheetControls } from '../../hooks/general/useSheetControls';
import { FiatCurrencyButton } from '../general/FiatCurrencyButton';
import { FiatCurrencySheet } from '../general/FiatCurrencySheet/FiatCurrencySheet';

const FIAT_CURRENCY_PICKER_TEST_ID = '@trading/buy/fiat-button';

export const BuyFiatCurrencyPicker = () => {
    const form = useBuyFormContext();
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useSheetControls(form, 'fiatCurrency');

    return (
        <>
            <HStack justifyContent="space-between" alignItems="center">
                <FiatCurrencyButton
                    currency={selectedValue}
                    onPress={showSheet}
                    testID={FIAT_CURRENCY_PICKER_TEST_ID}
                />
                <BuyFiatAmountInput />
            </HStack>
            <FiatCurrencySheet
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onFiatSelect={setSelectedValue}
            />
        </>
    );
};
