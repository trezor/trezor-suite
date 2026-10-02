import { type Ref } from 'react';
import { type TextInput } from 'react-native';
import { useSelector } from 'react-redux';

import { selectTradingBuyIsLoading } from '@suite-common/trading';
import { useField, useWatch } from '@suite-native/forms';

import { useBuyBaseCurrencyAmount } from '../../hooks/buy/useBuyBaseCurrencyAmount';
import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { useInputFieldControls } from '../../hooks/general/useInputFieldControls';
import { TradingBaseCurrencyAmountInput } from '../general/TradingBaseCurrencyAmountInput';

export type BuyBaseCurrencyAmountInputProps = {
    showAssetsSheet: () => void;
    ref?: Ref<TextInput>;
};

const BUY_BASE_CURRENCY_INPUT_TEST_ID = '@trading/buy/base-currency-amount-input';

export const BuyBaseCurrencyAmountInput = ({
    showAssetsSheet,
    ref,
}: BuyBaseCurrencyAmountInputProps) => {
    const isLoading = useSelector(selectTradingBuyIsLoading);

    const { control, setValue } = useBuyFormContext();
    const [asset, amountInCrypto] = useWatch({ control, name: ['asset', 'amountInCrypto'] });
    const { hasError } = useField({ name: 'cryptoValue' });
    const { baseCurrencyAmount, isConversionAvailable, setBaseCurrencyAmount } =
        useBuyBaseCurrencyAmount();
    const { onFocus, onBlur } = useInputFieldControls(
        'cryptoBaseCurrencyValue',
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
            onPress={isAssetSelected ? undefined : showAssetsSheet}
            hasError={hasError}
            isEditable={isConversionAvailable}
            isLoading={isLoading && !amountInCrypto}
            testID={BUY_BASE_CURRENCY_INPUT_TEST_ID}
        />
    );
};
