import { useSelector } from 'react-redux';

import { selectTradingBuyIsLoading } from '@suite-common/trading';
import { useField, useWatch } from '@suite-native/forms';

import { useBuyBaseCurrencyAmount } from '../../hooks/buy/useBuyBaseCurrencyAmount';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useInputFieldControls } from '../../hooks/general/useInputFieldControls';
import { TradingBaseCurrencyAmountInput } from '../general/TradingBaseCurrencyAmountInput';

const BUY_BASE_CURRENCY_INPUT_TEST_ID = '@trading/buy/base-currency-amount-input';

export const BuyBaseCurrencyAmountInput = () => {
    const isLoading = useSelector(selectTradingBuyIsLoading);

    const { control, setValue } = useBuyFormContext();
    const amountInCrypto = useWatch({ control, name: 'amountInCrypto' });
    const { hasError } = useField({ name: 'cryptoValue' });
    const { baseCurrencyAmount, isConversionAvailable, setBaseCurrencyAmount } =
        useBuyBaseCurrencyAmount();
    const { onFocus, onBlur } = useInputFieldControls(
        'cryptoBaseCurrencyValue',
        baseCurrencyAmount,
        setValue,
    );

    return (
        <TradingBaseCurrencyAmountInput
            value={baseCurrencyAmount}
            onChangeText={setBaseCurrencyAmount}
            onFocus={onFocus}
            onBlur={onBlur}
            hasError={hasError}
            isEditable={isConversionAvailable}
            isLoading={isLoading && !amountInCrypto}
            testID={BUY_BASE_CURRENCY_INPUT_TEST_ID}
        />
    );
};
