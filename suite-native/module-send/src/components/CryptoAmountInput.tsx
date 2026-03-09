import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { selectBaseCurrency, selectIsBaseCurrencyInSats } from '@suite-common/wallet-core';
import { getDecimalsForBaseCurrency } from '@suite-common/wallet-utils';
import { Input, Text } from '@suite-native/atoms';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { useField, useFormContext } from '@suite-native/forms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { type TokensRootState, selectAccountTokenSymbol } from '@suite-native/tokens';
import { useDebounce } from '@trezor/react-utils';
import { type Color } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { type SendOutputsFormValues } from '../sendOutputsFormSchema';
import { type SendAmountInputProps } from '../types';
import { getOutputFieldName } from '../utils';

export const SendAmountCurrencyLabelWrapper = ({
    children,
    isDisabled,
}: {
    children: ReactNode;
    isDisabled: boolean;
}) => {
    const textColor: Color = isDisabled ? 'textSubdued' : 'textDefault';

    return <Text color={textColor}>{children}</Text>;
};

export const CryptoAmountInput = ({
    recipientIndex,
    inputRef,
    symbol,
    tokenContract,
    accountKey,
    onPress,
    isDisabled = false,
}: SendAmountInputProps) => {
    const { setValue, trigger } = useFormContext<SendOutputsFormValues>();
    const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);
    const { DisplaySymbolFormatter: formatter } = useFormatters();
    const debounce = useDebounce();

    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenContract),
    );

    const cryptoFieldName = getOutputFieldName(recipientIndex, 'amount');
    const fiatFieldName = getOutputFieldName(recipientIndex, 'fiat');

    const { onChange, onBlur, value, hasError } = useField({
        name: cryptoFieldName,
        valueTransformer: cryptoAmountTransformer,
    });

    const converters = useCryptoFiatConverters({ symbol, tokenContract });

    const baseCurrencyDecimals = getDecimalsForBaseCurrency({
        code: baseCurrencyCode,
        isInSats: isBaseCurrencyInSats,
    });

    const handleChangeValue = (newValue: string) => {
        const transformedValue = cryptoAmountTransformer(newValue);
        onChange(transformedValue);

        if (transformedValue) {
            const fiatValue = converters?.convertCryptoToFiat?.(new BigNumber(transformedValue));
            if (fiatValue && !fiatValue.isNaN()) {
                setValue(fiatFieldName, fiatValue.toFixed(baseCurrencyDecimals));
            }
        } else {
            setValue(fiatFieldName, '');
        }
        setValue('setMaxOutputId', undefined);
        debounce(() => {
            trigger(cryptoFieldName);
        });
    };

    const handleBlur = () => {
        if (value) onBlur();
    };

    return (
        <Input
            ref={inputRef}
            value={value}
            placeholder="0"
            keyboardType="numeric"
            accessibilityLabel="amount to send input"
            testID={cryptoFieldName}
            editable={!isDisabled}
            onChangeText={handleChangeValue}
            onBlur={handleBlur}
            onPress={onPress}
            hasError={!isDisabled && hasError}
            rightIcon={
                <SendAmountCurrencyLabelWrapper isDisabled={isDisabled}>
                    {tokenSymbol ?? formatter.format(symbol)}
                </SendAmountCurrencyLabelWrapper>
            }
        />
    );
};
