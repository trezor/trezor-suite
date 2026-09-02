import { type RefObject } from 'react';
import { type TextInputProps } from 'react-native';
import { useSelector } from 'react-redux';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectIsBaseCurrencyInSats } from '@suite-common/wallet-core';
import { type TokenAddress, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { getDecimalsForBaseCurrency } from '@suite-common/wallet-utils';
import { Input, type InputType, Text } from '@suite-native/atoms';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { useField, useFormContext } from '@suite-native/forms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { BigNumber } from '@trezor/utils';

import { FIAT_INPUT_MAX_LENGTH } from '../../constants';
import { type EarnFormValues } from '../../utils/earn/earnFormSchema';
import { isAmountInputValueValid } from '../../utils/yield/yieldFiatAmountUtils';

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

        const baseCurrencyDecimals = getDecimalsForBaseCurrency({
            code: baseCurrencyCode,
            isInSats: isBaseCurrencyInSats,
        });
        if (!isAmountInputValueValid({ value: transformedValue, decimals: baseCurrencyDecimals })) {
            return;
        }

        onChange(transformedValue);

        // An emptied value has nothing to convert, so the crypto amount has to be cleared
        // explicitly - otherwise it keeps the last typed digit and the form stays submittable.
        if (!transformedValue) {
            setValue('amount', '', { shouldValidate: true });

            return;
        }

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
            maxLength={FIAT_INPUT_MAX_LENGTH}
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
