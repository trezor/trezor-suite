import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, TextInput, TextInputProps } from 'react-native';

import { BoxSkeleton } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { truncateDecimals } from '../../../utils/general/amountUtils';

export type AmountInputProps = {
    inputTransformer: (value: string) => string;
    maxDecimals?: number;
    hasError?: boolean;
    onChangeText: (text: string | undefined) => void;
    isLoading?: boolean;
    loadingAccessibilityLabel?: string;
} & Omit<TextInputProps, 'style' | 'onLayout' | 'onContentSizeChange' | 'onChangeText'>;

const MAX_FONT_SIZE = 34;
const MIN_FONT_SIZE = Math.ceil(MAX_FONT_SIZE / 2);
const FONT_TO_LINE_HEIGHT_RATIO = 1.235;
const FONT_SIZE_SHRINK_THRESHOLD = 20;
const FONT_SIZE_GROW_HYSTERESIS = 20;

export const MIN_INPUT_WIDTH = 70;
export const MAX_INPUT_HEIGHT = Math.floor(MAX_FONT_SIZE * FONT_TO_LINE_HEIGHT_RATIO);

export const AMOUNT_INPUT_TEST_ID = '@trading/amountInput/wrapper';

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

export const AmountInput = forwardRef<TextInput, AmountInputProps>(
    (
        {
            onPress,
            value,
            maxDecimals,
            inputTransformer,
            maxLength,
            onChangeText,
            hasError = false,
            onFocus,
            onBlur,
            isLoading,
            loadingAccessibilityLabel,
            ...inputProps
        },
        ref,
    ) => {
        const innerRef = useRef<TextInput>(null);
        useImperativeHandle(ref, () => innerRef.current!, []);

        const { applyStyle, utils } = useNativeStyles();
        const { fontSize, onBoxLayout, onInputLayout } = useInputLayoutControls();

        const handleTextChange = useCallback(
            (text: string) => {
                let transformedText = inputTransformer(text);
                transformedText = truncateDecimals(transformedText, maxDecimals);
                transformedText = transformedText.slice(0, maxLength);

                return onChangeText(transformedText === '' ? undefined : transformedText);
            },
            [maxLength, maxDecimals, inputTransformer, onChangeText],
        );

        const focusInputCallback = useCallback(() => {
            innerRef.current?.focus();
        }, [innerRef]);
        const wrapperOnPress = onPress ?? focusInputCallback;

        if (isLoading) {
            return (
                <BoxSkeleton
                    height={MAX_INPUT_HEIGHT}
                    width={MIN_INPUT_WIDTH}
                    accessibilityLabel={loadingAccessibilityLabel}
                />
            );
        }

        // Note: it would be nice to use `onContentSizeChange` instead of `onLayout` on `<Pressable />` once this bug is fixed https://github.com/facebook/react-native/issues/29702.
        // It would also allow us to remove `innerRef` and `useImperativeHandle` logic.
        return (
            <Pressable
                style={applyStyle(boxStyle)}
                onLayout={onBoxLayout}
                testID={AMOUNT_INPUT_TEST_ID}
                onPress={wrapperOnPress}
            >
                <TextInput
                    ref={innerRef}
                    style={applyStyle(inputStyle, { hasError, fontSize })}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    placeholder="0.0"
                    placeholderTextColor={utils.colors.textDisabled}
                    value={value}
                    maxLength={maxLength}
                    onChangeText={handleTextChange}
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
