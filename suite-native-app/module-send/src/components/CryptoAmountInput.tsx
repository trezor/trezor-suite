import { type ReactNode } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { Input, Text } from '@suite-native/atoms';
import { useField } from '@suite-native/forms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { TokenSymbol } from '@suite-native/tokens';
import { useDebounce } from '@trezor/react-utils';
import { type Color } from '@trezor/theme';

import { useSendFormContext } from '../hooks/useSendFormContext';
import { type SendAmountInputProps } from '../types';
import { getOutputFieldName } from '../utils';

export const SendAmountCurrencyLabelWrapper = ({
    children,
    isDisabled,
}: {
    children: ReactNode;
    isDisabled: boolean;
}) => {
    const textColor: Color = isDisabled ? 'contentSecondary' : 'contentPrimary';

    return <Text color={textColor}>{children}</Text>;
};

export const CryptoAmountInput = ({
    recipientIndex,
    inputRef,
    symbol,
    tokenContract,
    onPress,
    isDisabled = false,
}: SendAmountInputProps) => {
    const { setValue, trigger, updateFiatAmount } = useSendFormContext();
    const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);
    const { DisplaySymbolFormatter: formatter } = useFormatters();
    const debounce = useDebounce();

    const cryptoFieldName = getOutputFieldName(recipientIndex, 'amount');

    const { onChange, onBlur, value, hasError } = useField({
        name: cryptoFieldName,
        valueTransformer: cryptoAmountTransformer,
    });

    const handleChangeValue = (newValue: string) => {
        const transformedValue = cryptoAmountTransformer(newValue);
        onChange(transformedValue);

        updateFiatAmount({ amount: transformedValue, recipientIndex });
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
            labelType="noLabel"
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
                tokenContract ? (
                    <TokenSymbol
                        isTruncated
                        networkSymbol={symbol}
                        contractAddress={tokenContract}
                        color={isDisabled ? 'contentSecondary' : 'contentPrimary'}
                    />
                ) : (
                    <Text color={isDisabled ? 'contentSecondary' : 'contentPrimary'}>
                        {formatter.format(symbol)}
                    </Text>
                )
            }
        />
    );
};
