import { useField } from '@suite-native/forms';

import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useExchangeSendBaseCurrencyAmount } from '../../../hooks/exchange/useExchangeSendBaseCurrencyAmount';
import { useInputFieldControls } from '../../../hooks/general/useInputFieldControls';
import { TradingBaseCurrencyAmountInput } from '../../general/TradingBaseCurrencyAmountInput';

const EXCHANGE_SEND_BASE_CURRENCY_INPUT_TEST_ID =
    '@trading/exchange/send-base-currency-amount-input';

export const ExchangeSendBaseCurrencyAmountInput = () => {
    const { setValue } = useExchangeFormContext();
    const { hasError } = useField({ name: 'sendCryptoAmount' });
    const { baseCurrencyAmount, isConversionAvailable, setBaseCurrencyAmount } =
        useExchangeSendBaseCurrencyAmount();
    const { onFocus, onBlur } = useInputFieldControls(
        'sendBaseCurrencyAmount',
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
            testID={EXCHANGE_SEND_BASE_CURRENCY_INPUT_TEST_ID}
        />
    );
};
