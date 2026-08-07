import { type RefObject } from 'react';
import { type TextInputProps } from 'react-native';
import { useSelector } from 'react-redux';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectIsBaseCurrencyInSats } from '@suite-common/wallet-core';
import { type TokenAddress, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Input, type InputType, Text } from '@suite-native/atoms';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { useField, useFormContext } from '@suite-native/forms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { BigNumber } from '@trezor/utils';

import { type EarnFormValues } from '../earnFormSchema';

type EarnFiatAmountInputProps = {
    symbol: NetworkSymbol;
    tokenContract?: TokenAddress;
    tokenDecimals?: number;
    accessibilityLabel?: string;
    inputRef?: RefObject<InputType | null>;
    isDisabled?: boolean;
    onPress?: TextInputProps['onPress'];
};

export const EarnFiatAmountInput = ({
    symbol,
    tokenContract,
    tokenDecimals,
    accessibilityLabel = 'fiat amount to stake input',
    inputRef,
    isDisabled = false,
    onPress,
}: EarnFiatAmountInputProps) => {
    const { setValue } = useFormContext<EarnFormValues>();
    const { fiatAmountTransformer } = useAmountInputTransformers(symbol);
    const decimals = tokenDecimals ?? getNetwork(symbol).decimals;
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);
    const converters = useCryptoFiatConverters({ symbol, tokenContract });

    const { onChange, onBlur, value } = useField({
        name: 'fiat',
        valueTransformer: fiatAmountTransformer,
    });
    const { hasError } = useField({ name: 'amount' });

    const handleChangeValue = (newValue: string) => {
        const transformedValue = fiatAmountTransformer(newValue);
        onChange(transformedValue);

        const cryptoValue = converters?.convertFiatToCrypto?.(
            asBaseCurrencyAmount(new BigNumber(transformedValue)),
        );
        if (cryptoValue) {
            setValue('amount', cryptoValue.toFixed(decimals), { shouldValidate: true });
        }
    };

    return (
        <Input
            ref={inputRef}
            labelType="noLabel"
            value={value}
            placeholder="0"
            keyboardType="numeric"
            accessibilityLabel={accessibilityLabel}
            editable={!isDisabled}
            onChangeText={handleChangeValue}
            onBlur={onBlur}
            onPress={onPress}
            hasError={!isDisabled && hasError}
            rightIcon={
                <Text color={isDisabled ? 'contentSecondary' : 'contentPrimary'}>
                    {isBaseCurrencyInSats ? 'sat' : baseCurrencyCode.toUpperCase()}
                </Text>
            }
        />
    );
};
