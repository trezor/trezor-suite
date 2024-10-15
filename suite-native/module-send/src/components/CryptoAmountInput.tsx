import { ReactNode } from 'react';
import { Pressable } from 'react-native';
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
import { useSendAmountTransformers } from '../hooks/useSendAmountTransformers';
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
    onPress,
    onFocus,
    isDisabled = false,
}: SendAmountInputProps) => {
    const { applyStyle } = useNativeStyles();
    const { setValue, trigger } = useFormContext();
    const { cryptoAmountTransformer } = useSendAmountTransformers(networkSymbol);
    const { NetworkSymbolFormatter: formatter } = useFormatters();
    const debounce = useDebounce();

    const cryptoFieldName = getOutputFieldName(recipientIndex, 'amount');
    const fiatFieldName = getOutputFieldName(recipientIndex, 'fiat');

    const { onChange, onBlur, value, hasError } = useField({
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
        const transformedValue = cryptoAmountTransformer(newValue);
        onChange(transformedValue);
        setValue(fiatFieldName, converters?.convertCryptoToFiat?.(transformedValue));
        debounce(() => {
            trigger(cryptoFieldName);
            onFocus?.();
        });
    };

    const handleBlur = () => {
        if (value) onBlur();
    };

    return (
        <Animated.View
            style={[applyStyle(sendAmountInputWrapperStyle, { isDisabled }), cryptoAnimatedStyle]}
        >
            <Pressable onPress={onPress} /* onPress doesn't work on Android for disabled Input */>
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
                    onFocus={onFocus}
                    hasError={!isDisabled && hasError}
                    rightIcon={
                        <SendAmountCurrencyLabelWrapper isDisabled={isDisabled}>
                            {formatter.format(networkSymbol)}
                        </SendAmountCurrencyLabelWrapper>
                    }
                />
            </Pressable>
        </Animated.View>
    );
};
