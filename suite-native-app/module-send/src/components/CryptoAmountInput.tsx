import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { useFormatters } from '@suite-common/formatters';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { Input, Text } from '@suite-native/atoms';
import { useField } from '@suite-native/forms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { type TokensRootState, selectAccountTokenSymbol } from '@suite-native/tokens';
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
    accountKey,
    onPress,
    isDisabled = false,
}: SendAmountInputProps) => {
    const { setValue, trigger, updateFiatAmount } = useSendFormContext();
    const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);
    const { DisplaySymbolFormatter: formatter } = useFormatters();
    const debounce = useDebounce();

    const tokenSymbol = useSelector((state: TokensRootState) =>
        selectAccountTokenSymbol(state, accountKey, tokenContract),
    );

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
                <SendAmountCurrencyLabelWrapper isDisabled={isDisabled}>
                    {tokenSymbol !== null
                        ? getDisplaySymbol(tokenSymbol, tokenContract)
                        : formatter.format(symbol)}
                </SendAmountCurrencyLabelWrapper>
            }
        />
    );
};
