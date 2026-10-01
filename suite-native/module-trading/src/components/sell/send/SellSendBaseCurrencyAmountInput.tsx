import { useSelector } from 'react-redux';

import { selectTradingSellIsLoading } from '@suite-common/trading';
import { useField, useWatch } from '@suite-native/forms';

import { useInputFieldControls } from '../../../hooks/general/useInputFieldControls';
import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { useSellSendBaseCurrencyAmount } from '../../../hooks/sell/useSellSendBaseCurrencyAmount';
import { TradingBaseCurrencyAmountInput } from '../../general/TradingBaseCurrencyAmountInput';

const SELL_SEND_BASE_CURRENCY_INPUT_TEST_ID = '@trading/sell/send-base-currency-amount-input';

export const SellSendBaseCurrencyAmountInput = () => {
    const isLoading = useSelector(selectTradingSellIsLoading);

    const { control, setValue } = useSellFormContext();
    const amountInCrypto = useWatch({ control, name: 'amountInCrypto' });
    const { hasError } = useField({ name: 'cryptoStringAmount' });
    const { baseCurrencyAmount, isConversionAvailable, setBaseCurrencyAmount } =
        useSellSendBaseCurrencyAmount();
    const { onFocus, onBlur } = useInputFieldControls(
        'cryptoBaseCurrencyStringAmount',
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
            testID={SELL_SEND_BASE_CURRENCY_INPUT_TEST_ID}
        />
    );
};
