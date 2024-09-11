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
import { useSendAmountTransformers } from '../useSendAmountTransformers';
import { getOutputFieldName } from '../utils';

export const FiatAmountInput = ({
    recipientIndex,
    scaleValue,
    translateValue,
    inputRef,
    networkSymbol,
    isDisabled = false,
}: SendAmountInputProps) => {
    const { applyStyle } = useNativeStyles();
    const { setValue } = useFormContext();
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

    const handleChangeValue = (newValue: string) => {
        onChange(newValue);
        setValue(cryptoFieldName, converters?.convertFiatToCrypto?.(newValue) ?? '', {
            shouldValidate: true,
        });
    };

    return (
        <Animated.View
            style={[applyStyle(sendAmountInputWrapperStyle, { isDisabled }), fiatAnimatedStyle]}
        >
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
                rightIcon={
                    <SendAmountCurrencyLabelWrapper isDisabled={isDisabled}>
                        {fiatCurrencyCode.toUpperCase()}
                    </SendAmountCurrencyLabelWrapper>
                }
            />
        </Animated.View>
    );
};
