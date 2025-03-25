import { useTradeSheetControls } from '../../hooks/useTradeSheetControls';
import { TradingBuyForm } from '../../types';
import { FiatCurrencyButton } from '../general/FiatCurrencyButton';
import { FiatCurrencySheet } from '../general/FiatCurrencySheet/FiatCurrencySheet';

export type FiatCurrencyPickerProps = {
    form: TradingBuyForm;
};

export const FiatCurrencyPicker = ({ form }: FiatCurrencyPickerProps) => {
    const { isSheetVisible, hideSheet, showSheet, setSelectedValue, selectedValue } =
        useTradeSheetControls(form, 'fiatCurrency');

    return (
        <>
            <FiatCurrencyButton currency={selectedValue} onPress={showSheet} />
            <FiatCurrencySheet
                isVisible={isSheetVisible}
                onClose={hideSheet}
                onFiatSelect={setSelectedValue}
            />
        </>
    );
};
