import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { Input } from '@suite-native/atoms';
import { useFormContext } from '@suite-native/forms';
import { useField } from '@suite-native/forms';
import { useCryptoFiatConverters } from '@suite-native/formatters';
import { useNativeStyles } from '@trezor/styles';
import { selectFiatCurrencyCode } from '@suite-native/settings';

import { SendAmountCurrencyLabelWrapper, sendAmountInputWrapperStyle } from './CryptoAmountInput';
import { SendAmountInputProps } from '../types';
import { useSendAmountTransformers } from '../hooks/useSendAmountTransformers';
import { getOutputFieldName } from '../utils';
import { SendOutputsFormValues } from '../sendOutputsFormSchema';

export const FiatAmountInput = ({
    recipientIndex,
    scaleValue,
    translateValue,
    inputRef,
    networkSymbol,
    onPress,
    onFocus,
    isDisabled = false,
}: SendAmountInputProps) => {
    const { applyStyle } = useNativeStyles();
    const { setValue } = useFormContext<SendOutputsFormValues>();
    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const { fiatAmountTransformer } = useSendAmountTransformers(networkSymbol);
    const converters = useCryptoFiatConverters({ networkSymbol });

    const cryptoFieldName = getOutputFieldName(recipientIndex, 'amount');
    const fiatFieldName = getOutputFieldName(recipientIndex, 'fiat');

    const fiatAnimatedStyle = useAnimatedStyle(
        () => ({
            transform: [{ scale: scaleValue.value }, { translateY: translateValue.value }],
            zIndex: isDisabled ? 0 : 1,
        }),
        [isDisabled],
    );

    const { onChange, onBlur, value } = useField({
        name: fiatFieldName,
        valueTransformer: fiatAmountTransformer,
    });

    // Validation is assigned to the crypto field, so we need to check if that field has an error.
    const { hasError } = useField({
        name: cryptoFieldName,
    });

    const handleChangeValue = (newValue: string) => {
        const transformedValue = fiatAmountTransformer(newValue);
        onChange(transformedValue);

        const cryptoValue = converters?.convertFiatToCrypto?.(transformedValue);
        if (cryptoValue) setValue(cryptoFieldName, cryptoValue, { shouldValidate: true });

        setValue('setMaxOutputId', undefined);
        onFocus?.();
    };

    return (
        <Animated.View
            style={[applyStyle(sendAmountInputWrapperStyle, { isDisabled }), fiatAnimatedStyle]}
        >
            <Pressable onPress={onPress} /* onPress doesn't work on Android for disabled Input */>
                <Input
                    ref={inputRef}
                    value={value}
                    placeholder="0"
                    keyboardType="numeric"
                    accessibilityLabel="amount to send input"
                    testID={fiatFieldName}
                    editable={!isDisabled}
                    onChangeText={handleChangeValue}
                    onBlur={onBlur}
                    onPress={onPress}
                    onFocus={onFocus}
                    hasError={!isDisabled && hasError}
                    rightIcon={
                        <SendAmountCurrencyLabelWrapper isDisabled={isDisabled}>
                            {fiatCurrencyCode.toUpperCase()}
                        </SendAmountCurrencyLabelWrapper>
                    }
                />
            </Pressable>
        </Animated.View>
    );
};
