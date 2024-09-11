import { ReactNode } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { Text, Input } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { useField } from '@suite-native/forms';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useFormatters } from '@suite-common/formatters';
import { Color } from '@trezor/theme';
import { useDebounce } from '@trezor/react-utils';

import { SendAmountInputProps } from '../types';
import { useSendAmountTransformers } from '../useSendAmountTransformers';
import { getOutputFieldName } from '../utils';

export const sendAmountInputWrapperStyle = prepareNativeStyle<{ isDisabled: boolean }>(
    (_, { isDisabled }) => ({
        position: 'absolute',
        top: isDisabled ? 2 : 0,
        flex: 1,
        width: '100%',
    }),
);

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
    scaleValue,
    translateValue,
    networkSymbol,
    isDisabled = false,
}: SendAmountInputProps) => {
    const { applyStyle } = useNativeStyles();
    const { setValue, trigger } = useFormContext();
    const { cryptoAmountTransformer } = useSendAmountTransformers(networkSymbol);
    const { NetworkSymbolFormatter: formatter } = useFormatters();
    const debounce = useDebounce();

    const cryptoFieldName = getOutputFieldName(recipientIndex, 'amount');
    const fiatFieldName = getOutputFieldName(recipientIndex, 'fiat');

    const { onChange, onBlur, value } = useField({
        name: cryptoFieldName,
        valueTransformer: cryptoAmountTransformer,
    });

    const converters = useCryptoFiatConverters({ networkSymbol });

    const cryptoAnimatedStyle = useAnimatedStyle(
        () => ({
            transform: [{ scale: scaleValue.value }, { translateY: translateValue.value }],
            zIndex: isDisabled ? 0 : 1,
        }),
        [isDisabled],
    );

    const handleChangeValue = (newValue: string) => {
        onChange(newValue);
        setValue(fiatFieldName, converters?.convertCryptoToFiat?.(newValue) ?? '');
        debounce(() => trigger(cryptoFieldName));
    };

    return (
        <Animated.View
            style={[applyStyle(sendAmountInputWrapperStyle, { isDisabled }), cryptoAnimatedStyle]}
        >
            <Input
                ref={inputRef}
                value={value}
                placeholder="0"
                keyboardType="numeric"
                accessibilityLabel="amount to send input"
                testID={cryptoFieldName}
                editable={!isDisabled}
                onChangeText={handleChangeValue}
                onBlur={onBlur}
                rightIcon={
                    <SendAmountCurrencyLabelWrapper isDisabled={isDisabled}>
                        {formatter.format(networkSymbol)}
                    </SendAmountCurrencyLabelWrapper>
                }
            />
        </Animated.View>
    );
};
