import { type RefObject } from 'react';
import { type TextInputProps } from 'react-native';
import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectIsBaseCurrencyInSats } from '@suite-common/wallet-core';
import { getDecimalsForBaseCurrency } from '@suite-common/wallet-utils';
import { Input, type InputType, Text } from '@suite-native/atoms';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { useField, useFormContext } from '@suite-native/forms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { useDebounce } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { type EarnFormValues } from '../earnFormSchema';

type EarnCryptoAmountInputProps = {
    symbol: NetworkSymbol;
    inputRef?: RefObject<InputType | null>;
    isDisabled?: boolean;
    onPress?: TextInputProps['onPress'];
};

export const EarnCryptoAmountInput = ({
    symbol,
    inputRef,
    isDisabled = false,
    onPress,
}: EarnCryptoAmountInputProps) => {
    const { setValue, trigger } = useFormContext<EarnFormValues>();
    const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);
    const { DisplaySymbolFormatter: formatter } = useFormatters();
    const debounce = useDebounce();
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);
    const baseCurrencyDecimals = getDecimalsForBaseCurrency({
        code: baseCurrencyCode,
        isInSats: isBaseCurrencyInSats,
    });
    const converters = useCryptoFiatConverters({ symbol });

    const { onChange, onBlur, value, hasError } = useField({
        name: 'amount',
        valueTransformer: cryptoAmountTransformer,
    });

    const handleChangeValue = (newValue: string) => {
        const transformedValue = cryptoAmountTransformer(newValue);
        onChange(transformedValue);

        if (transformedValue) {
            const fiatValue = converters?.convertCryptoToFiat?.(new BigNumber(transformedValue));
            if (fiatValue && !fiatValue.isNaN())
                setValue('fiat', fiatValue.toFixed(baseCurrencyDecimals));
        } else {
            setValue('fiat', '');
        }
        debounce(() => trigger('amount'));
    };

    return (
        <Input
            ref={inputRef}
            value={value}
            placeholder="0"
            keyboardType="numeric"
            accessibilityLabel="amount to stake input"
            editable={!isDisabled}
            onChangeText={handleChangeValue}
            onBlur={() => {
                if (value) onBlur();
            }}
            onPress={onPress}
            hasError={!isDisabled && hasError}
            rightIcon={
                <Text color={isDisabled ? 'textSubdued' : 'textDefault'}>
                    {formatter.format(symbol)}
                </Text>
            }
        />
    );
};
