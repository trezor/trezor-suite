import { HStack } from '@suite-native/atoms';

import { SellFiatAmountInput } from './SellFiatAmountInput';
import { SellFiatCurrencySheet } from './SellFiatCurrencySheet';
import { useSheetControls } from '../../../hooks/general/useSheetControls';
import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { FiatCurrencyButton } from '../../general/FiatCurrencyButton';

const FIAT_CURRENCY_PICKER_TEST_ID = '@trading/sell/fiat-button';

export const SellFiatCurrencyPicker = () => {
    const form = useSellFormContext();
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
                <SellFiatAmountInput />
            </HStack>
            <SellFiatCurrencySheet
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onFiatSelect={setSelectedValue}
                searchInputTestId="@trading/sell/fiat-search-input"
            />
        </>
    );
};
