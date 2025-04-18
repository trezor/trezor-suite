import { TextInput, TextInputProps } from 'react-native';

import { useField } from '@suite-native/forms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';

export type TradingAmountInputProps = {
    name: 'fiatValue' | 'cryptoValue';
    inputTransformer: (value: string) => string;
} & Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder' | 'style' | 'onBlur'>;

export const INPUT_MIN_WIDTH = 60;
export const INPUT_HEIGHT = 42;

// TODO test coverage for color
const inputStyle = prepareNativeStyle<{ hasError: boolean }>(
    ({ colors, typography }, { hasError }) => ({
        ...typography.body,
        color: hasError ? colors.textAlertRed : colors.textDefault,
        textAlign: 'right',
        fontSize: 34,
        lineHeight: INPUT_HEIGHT,
        minWidth: INPUT_MIN_WIDTH,
        flex: 1,
    }),
);

export const TradingAmountInput = ({
    name,
    inputTransformer,
    maxLength,
    ...inputProps
}: TradingAmountInputProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const { getValues, setValue } = useTradingBuyFormContext();
    // do not use `value` from `useField` here, because it does not work properly with `undefined`
    const value = getValues(name);
    const { onChange, onBlur, hasError } = useField({ name });

    const setFocusedValue = () => {
        setValue('focusedValue', name);
    };

    const clearFocusedValue = () => {
        setValue('focusedValue', undefined);
    };

    const handleTextChange = (text: string) => {
        const transformedText = inputTransformer(text);
        const truncatedText = transformedText.slice(0, maxLength);

        return onChange(truncatedText === '' ? undefined : truncatedText);
    };

    return (
        <TextInput
            style={applyStyle(inputStyle, { hasError })}
            placeholder="0.0"
            keyboardType="decimal-pad"
            inputMode="decimal"
            value={value}
            onChangeText={handleTextChange}
            onFocus={setFocusedValue}
            onBlur={() => {
                onBlur();
                clearFocusedValue();
            }}
            maxLength={maxLength}
            placeholderTextColor={utils.colors.textDisabled}
            {...inputProps}
        />
    );
};
