import { type Ref, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { type LayoutChangeEvent, Pressable, TextInput, type TextInputProps } from 'react-native';

import { BoxSkeleton, HStack, TEXT_MAX_FONT_MULTIPLIER, Text } from '@suite-native/atoms';
import { truncateDecimals } from '@suite-native/helpers';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type NativeTypographyStyle, typographyStylesBase } from '@trezor/theme';

type AmountInputSizeConfig = {
    typography: NativeTypographyStyle;
    maxFontSize: number;
    minFontSize: number;
    lineHeightRatio: number;
    minWidth: number;
    shrinkThreshold: number;
    growHysteresis: number;
};

const amountInputSizes = {
    medium: {
        typography: 'body-md',
        maxFontSize: 34,
        minFontSize: 17,
        lineHeightRatio: 1.235,
        minWidth: 70,
        shrinkThreshold: 20,
        growHysteresis: 20,
    },
    small: {
        typography: 'body-sm',
        maxFontSize: typographyStylesBase['body-sm'].fontSize,
        minFontSize: 10,
        lineHeightRatio:
            typographyStylesBase['body-sm'].lineHeight / typographyStylesBase['body-sm'].fontSize,
        minWidth: 40,
        shrinkThreshold: 20,
        growHysteresis: 20,
    },
} as const satisfies Record<string, AmountInputSizeConfig>;

export type AmountInputSize = keyof typeof amountInputSizes;

export type AmountInputProps = {
    inputTransformer: (value: string) => string;
    maxDecimals?: number;
    hasError?: boolean;
    onChangeText: (text: string | undefined) => void;
    isLoading?: boolean;
    loadingAccessibilityLabel?: string;
    size?: AmountInputSize;
    prefix?: string;
    ref?: Ref<TextInput>;
} & Omit<TextInputProps, 'style' | 'onLayout' | 'onContentSizeChange' | 'onChangeText'>;

export const AMOUNT_INPUT_TEST_ID = '@trading/amountInput/wrapper';
export const AMOUNT_INPUT_CONTENT_TEST_ID = '@trading/amountInput/content';

const getLineHeight = (fontSize: number, sizeConfig: AmountInputSizeConfig) =>
    Math.floor(fontSize * sizeConfig.lineHeightRatio);

const boxStyle = prepareNativeStyle(() => ({
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 0,
    marginLeft: 0,
    overflow: 'visible',
}));

const contentStyle = prepareNativeStyle<{ lineHeight: number }>((_, { lineHeight }) => ({
    minHeight: lineHeight,
}));

type TextStyleParams = {
    sizeConfig: AmountInputSizeConfig;
    fontSize: number;
    hasError: boolean;
    isPlaceholder: boolean;
};

const textStyle = prepareNativeStyle<TextStyleParams>(
    ({ colors, typography }, { sizeConfig, fontSize, hasError, isPlaceholder }) => ({
        ...typography[sizeConfig.typography],
        color: colors.contentPrimary,
        fontSize,
        lineHeight: undefined,

        extend: [
            { condition: isPlaceholder, style: { color: colors.contentDisabled } },
            { condition: hasError, style: { color: colors.contentCritical } },
        ],
    }),
);

const inputStyle = prepareNativeStyle<TextStyleParams>((_, { sizeConfig }) => ({
    minWidth: sizeConfig.minWidth,
}));

const useInputLayoutControls = (value: string | undefined, sizeConfig: AmountInputSizeConfig) => {
    const { maxFontSize, minFontSize, minWidth, shrinkThreshold, growHysteresis } = sizeConfig;

    const [availableWidth, setAvailableWidth] = useState(minWidth + shrinkThreshold);
    const [measuredFontSize, setFontSize] = useState(maxFontSize);

    const fontSize = Math.min(Math.max(measuredFontSize, minFontSize), maxFontSize);

    const handleAvailableWith = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
        const { width } = nativeEvent.layout;
        setAvailableWidth(width);
    }, []);

    const handleFontSizeOnContentChange = useCallback(
        ({ nativeEvent }: LayoutChangeEvent) => {
            const contentWidth = nativeEvent.layout.width;

            if (contentWidth === 0 || availableWidth === 0 || !value) {
                setFontSize(maxFontSize);

                return;
            }

            const shrinkThresholdWidth = availableWidth - shrinkThreshold;
            if (contentWidth > shrinkThresholdWidth) {
                const newFontSize = Math.max(
                    Math.floor((shrinkThresholdWidth / contentWidth) * fontSize),
                    minFontSize,
                );
                setFontSize(newFontSize);
            }

            const growThresholdWidth = shrinkThresholdWidth - growHysteresis;
            if (contentWidth < growThresholdWidth) {
                const newFontSize = Math.min(
                    Math.floor((shrinkThresholdWidth / contentWidth) * fontSize),
                    maxFontSize,
                );
                setFontSize(newFontSize);
            }
        },
        [
            availableWidth,
            fontSize,
            value,
            maxFontSize,
            minFontSize,
            shrinkThreshold,
            growHysteresis,
        ],
    );

    return {
        fontSize,
        onBoxLayout: handleAvailableWith,
        onContentLayout: handleFontSizeOnContentChange,
    };
};

export const AmountInput = ({
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
    size = 'medium',
    prefix,
    ref,
    ...inputProps
}: AmountInputProps) => {
    const innerRef = useRef<TextInput>(null);
    useImperativeHandle(ref, () => innerRef.current!, []);

    const sizeConfig = amountInputSizes[size];
    const { applyStyle, utils } = useNativeStyles();
    const { fontSize, onBoxLayout, onContentLayout } = useInputLayoutControls(value, sizeConfig);

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
                height={getLineHeight(sizeConfig.maxFontSize, sizeConfig)}
                width={sizeConfig.minWidth}
                accessibilityLabel={loadingAccessibilityLabel}
            />
        );
    }

    const textStyleParams: TextStyleParams = {
        sizeConfig,
        fontSize,
        hasError,
        isPlaceholder: !value,
    };

    // Note: it would be nice to use `onContentSizeChange` instead of `onLayout` on `<Pressable />` once this bug is fixed https://github.com/facebook/react-native/issues/29702.
    // It would also allow us to remove `innerRef` and `useImperativeHandle` logic.
    return (
        <Pressable
            style={applyStyle(boxStyle)}
            onLayout={onBoxLayout}
            testID={AMOUNT_INPUT_TEST_ID}
            onPress={wrapperOnPress}
        >
            <HStack
                spacing="sp2"
                flexDirection="row"
                alignItems="center"
                style={applyStyle(contentStyle, {
                    lineHeight: getLineHeight(fontSize, sizeConfig),
                })}
                onLayout={onContentLayout}
                testID={AMOUNT_INPUT_CONTENT_TEST_ID}
            >
                {!!prefix && (
                    <Text
                        variant={sizeConfig.typography}
                        style={applyStyle(textStyle, textStyleParams)}
                        maxFontSizeMultiplier={TEXT_MAX_FONT_MULTIPLIER}
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    >
                        {prefix}
                    </Text>
                )}
                <TextInput
                    ref={innerRef}
                    style={applyStyle([textStyle, inputStyle], textStyleParams)}
                    maxFontSizeMultiplier={TEXT_MAX_FONT_MULTIPLIER}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    placeholder="0.0"
                    placeholderTextColor={utils.colors.contentDisabled}
                    value={value}
                    maxLength={maxLength}
                    onChangeText={handleTextChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onPress={onPress}
                    {...inputProps}
                />
            </HStack>
        </Pressable>
    );
};
