import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, TextInput, TextInputProps } from 'react-native';

import { useField } from '@suite-native/forms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';

export type TradingAmountInputProps = {
    name: 'fiatValue' | 'cryptoValue';
    inputTransformer: (value: string) => string;
    maxDecimals?: number;
} & Omit<
    TextInputProps,
    'value' | 'style' | 'onBlur' | 'onFocus' | 'onChangeText' | 'onLayout' | 'onContentSizeChange'
>;

const MAX_FONT_SIZE = 34;
const MIN_FONT_SIZE = Math.ceil(MAX_FONT_SIZE / 2);
const FONT_TO_LINE_HEIGHT_RATIO = 1.235;
const FONT_SIZE_SHRINK_THRESHOLD = 20;
const FONT_SIZE_GROW_HYSTERESIS = 20;

export const MIN_INPUT_WIDTH = 70;
export const MAX_INPUT_HEIGHT = Math.floor(MAX_FONT_SIZE * FONT_TO_LINE_HEIGHT_RATIO);

const boxStyle = prepareNativeStyle(() => ({
    flex: 1,
    alignItems: 'flex-end',
    paddingLeft: 0,
    marginLeft: 0,
    overflow: 'visible',
}));

const inputStyle = prepareNativeStyle<{ hasError: boolean; fontSize: number }>(
    ({ colors, typography }, { hasError, fontSize }) => ({
        ...typography.body,
        color: hasError ? colors.textAlertRed : colors.textDefault,
        textAlign: 'right',
        fontSize,
        lineHeight: Math.floor(fontSize * FONT_TO_LINE_HEIGHT_RATIO),
        minWidth: MIN_INPUT_WIDTH,
    }),
);

const useInputLayoutControls = () => {
    const [availableWidth, setAvailableWidth] = useState(
        MIN_INPUT_WIDTH + FONT_SIZE_SHRINK_THRESHOLD,
    );
    const [fontSize, setFontSize] = useState(MAX_FONT_SIZE);

    const handleAvailableWith = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
        const { width } = nativeEvent.layout;
        setAvailableWidth(width);
    }, []);

    const handleFontSizeOnContentChange = useCallback(
        ({ nativeEvent }: LayoutChangeEvent) => {
            const contentWidth = nativeEvent.layout.width;

            if (contentWidth === 0 || availableWidth === 0) {
                setFontSize(MAX_FONT_SIZE);

                return;
            }

            const shrinkThreshold = availableWidth - FONT_SIZE_SHRINK_THRESHOLD;
            if (contentWidth > shrinkThreshold) {
                const newFontSize = Math.max(
                    Math.floor((shrinkThreshold / contentWidth) * fontSize),
                    MIN_FONT_SIZE,
                );
                setFontSize(newFontSize);
            }

            const growThreshold = shrinkThreshold - FONT_SIZE_GROW_HYSTERESIS;
            if (contentWidth < growThreshold) {
                const newFontSize = Math.min(
                    Math.floor((shrinkThreshold / contentWidth) * fontSize),
                    MAX_FONT_SIZE,
                );
                setFontSize(newFontSize);
            }
        },
        [availableWidth, fontSize],
    );

    return {
        fontSize,
        onBoxLayout: handleAvailableWith,
        onInputLayout: handleFontSizeOnContentChange,
    };
};

const useInputFormControls = (
    name: 'fiatValue' | 'cryptoValue',
    inputTransformer: (value: string) => string,
    maxLength: number | undefined,
    maxDecimals: number | undefined,
) => {
    const { getValues, setValue } = useTradingBuyFormContext();
    // do not use `value` from `useField` here, because it does not work properly with `undefined`
    const value = getValues(name);
    const { onChange, onBlur, hasError } = useField({ name });

    const setFocusedValue = useCallback(() => {
        setValue('focusedValue', name);
    }, [name, setValue]);

    const maxDecimalRegex = useMemo(
        () =>
            maxDecimals !== undefined ? new RegExp(`[.](\\d{${maxDecimals}})(\\d+)$`) : undefined,
        [maxDecimals],
    );

    const handleTextChange = useCallback(
        (text: string) => {
            let transformedText = inputTransformer(text);
            if (maxDecimalRegex) {
                transformedText = transformedText.replace(maxDecimalRegex, '.$1');
            }
            transformedText = transformedText.slice(0, maxLength);

            return onChange(transformedText === '' ? undefined : transformedText);
        },
        [maxLength, maxDecimalRegex, inputTransformer, onChange],
    );

    const clearFocusedValueAndBlur = useCallback(() => {
        onBlur();
        setValue('focusedValue', undefined);
    }, [onBlur, setValue]);

    return {
        value,
        hasError,
        onFocus: setFocusedValue,
        onChangeText: handleTextChange,
        onBlur: clearFocusedValueAndBlur,
    };
};

export const TradingAmountInput = forwardRef<TextInput, TradingAmountInputProps>(
    ({ name, inputTransformer, maxLength, maxDecimals, onPress, ...inputProps }, ref) => {
        const innerRef = useRef<TextInput>(null);
        useImperativeHandle(ref, () => innerRef.current!);

        const { applyStyle, utils } = useNativeStyles();
        const { fontSize, onBoxLayout, onInputLayout } = useInputLayoutControls();
        const { value, hasError, onFocus, onChangeText, onBlur } = useInputFormControls(
            name,
            inputTransformer,
            maxLength,
            maxDecimals,
        );

        const focusInputCallback = useCallback(() => {
            innerRef.current?.focus();
        }, [innerRef]);
        const wrapperOnPress = onPress ?? focusInputCallback;

        // Note: it would be nice to use `onContentSizeChange` instead of `onLayout` on `<Pressable />` once this bug is fixed https://github.com/facebook/react-native/issues/29702.
        // It would also allow us to remove `innerRef` and `useImperativeHandle` logic.
        return (
            <Pressable
                style={applyStyle(boxStyle)}
                onLayout={onBoxLayout}
                testID="@trading/amountInput/wrapper"
                onPress={wrapperOnPress}
            >
                <TextInput
                    ref={innerRef}
                    style={applyStyle(inputStyle, { hasError, fontSize })}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    placeholder="0.0"
                    placeholderTextColor={utils.colors.textDisabled}
                    value={value ?? ''}
                    maxLength={maxLength}
                    onChangeText={onChangeText}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onLayout={onInputLayout}
                    onPress={onPress}
                    {...inputProps}
                />
            </Pressable>
        );
    },
);
