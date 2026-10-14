import { type Ref } from 'react';
import { type TextInput } from 'react-native';

import { useField, useWatch } from '@suite-native/forms';

import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useExchangeSendBaseCurrencyAmount } from '../../../hooks/exchange/useExchangeSendBaseCurrencyAmount';
import { useInputFieldControls } from '../../../hooks/general/useInputFieldControls';
import { TradingBaseCurrencyAmountInput } from '../../general/TradingBaseCurrencyAmountInput';

export type ExchangeSendBaseCurrencyAmountInputProps = {
    onSelectAsset: () => void;
    ref?: Ref<TextInput>;
};

const EXCHANGE_SEND_BASE_CURRENCY_INPUT_TEST_ID =
    '@trading/exchange/send-base-currency-amount-input';

export const ExchangeSendBaseCurrencyAmountInput = ({
    onSelectAsset,
    ref,
}: ExchangeSendBaseCurrencyAmountInputProps) => {
    const { control, setValue } = useExchangeFormContext();
    const asset = useWatch({ control, name: 'sendAsset' });
    const { hasError } = useField({ name: 'sendCryptoAmount' });
    const { baseCurrencyAmount, isConversionAvailable, setBaseCurrencyAmount } =
        useExchangeSendBaseCurrencyAmount();
    const { onFocus, onBlur } = useInputFieldControls(
        'sendBaseCurrencyAmount',
        baseCurrencyAmount,
        setValue,
    );

    const isAssetSelected = !!asset;

    return (
        <TradingBaseCurrencyAmountInput
            ref={ref}
            value={baseCurrencyAmount}
            onChangeText={setBaseCurrencyAmount}
            onFocus={onFocus}
            onBlur={onBlur}
            onPress={isAssetSelected ? undefined : onSelectAsset}
            hasError={hasError}
            isEditable={isConversionAvailable}
            testID={EXCHANGE_SEND_BASE_CURRENCY_INPUT_TEST_ID}
        />
    );
};
