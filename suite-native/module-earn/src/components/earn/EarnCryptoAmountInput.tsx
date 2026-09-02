import { type RefObject } from 'react';
import { type TextInputProps } from 'react-native';
import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectIsBaseCurrencyInSats } from '@suite-common/wallet-core';
import { type TokenAddress } from '@suite-common/wallet-types';
import { getDecimalsForBaseCurrency } from '@suite-common/wallet-utils';
import { Input, type InputType, Text } from '@suite-native/atoms';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { useField, useFormContext } from '@suite-native/forms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { useDebounce } from '@trezor/react-utils';
import { BigNumber } from '@trezor/utils';

import { AMOUNT_INPUT_MAX_LENGTH } from '../../constants';
import { type EarnFormValues } from '../../utils/earn/earnFormSchema';
import { isAmountInputValueValid } from '../../utils/yield/yieldFiatAmountUtils';

type EarnCryptoAmountInputProps = {
    symbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    tokenDecimals?: number;
    displaySymbol?: string;
    accessibilityLabel?: string;
    inputRef?: RefObject<InputType | null>;
    isDisabled?: boolean;
    onPress?: TextInputProps['onPress'];
};

export const EarnCryptoAmountInput = ({
    symbol,
    tokenContract,
    tokenDecimals,
    displaySymbol,
    accessibilityLabel = 'amount to stake input',
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
    const converters = useCryptoFiatConverters({ symbol, tokenContract });

    const { onChange, onBlur, value, hasError } = useField({
        name: 'amount',
        valueTransformer: cryptoAmountTransformer,
    });

    const handleChangeValue = (newValue: string) => {
        const transformedValue = cryptoAmountTransformer(newValue);

        const decimals = tokenDecimals ?? getNetwork(symbol).decimals;
        if (!isAmountInputValueValid({ value: transformedValue, decimals })) {
            return;
        }

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
            labelType="noLabel"
            value={value}
            placeholder="0"
            keyboardType="numeric"
            maxLength={AMOUNT_INPUT_MAX_LENGTH}
            accessibilityLabel={accessibilityLabel}
            editable={!isDisabled}
            onChangeText={handleChangeValue}
            onBlur={() => {
                if (value) onBlur();
            }}
            onPress={onPress}
            hasError={!isDisabled && hasError}
            rightIcon={
                <Text color={isDisabled ? 'contentSecondary' : 'contentPrimary'}>
                    {displaySymbol ?? formatter.format(symbol)}
                </Text>
            }
        />
    );
};
