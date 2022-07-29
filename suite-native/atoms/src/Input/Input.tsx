import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { TextInput, Pressable } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { D } from '@mobily/ts-belt';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { nativeSpacings, defaultColorVariant } from '@trezor/theme';

import { Box } from '../Box';

export type InputColorScheme = 'white' | 'gray' | 'darkGray';

type InputProps = {
    value: string;
    label: string;
    onChange: (value: string) => void;
    hasError?: boolean;
    hasWarning?: boolean;
    leftIcon?: ReactNode;
    colorScheme?: InputColorScheme;
};

const INPUT_WRAPPER_PADDING_HORIZONTAL = 14;
const INPUT_WRAPPER_PADDING_VERTICAL = 17;
const INPUT_WRAPPER_PADDING_VERTICAL_MINIMIZED = nativeSpacings.small;
const INPUT_TEXT_HEIGHT = 24;

type InputWrapperStyleProps = {
    hasWarning: boolean;
    hasError: boolean;
    isLabelMinimized: boolean;
    colorScheme: InputColorScheme;
};

const inputTextColorSchemeStyles: Record<InputColorScheme, NativeStyleObject> = {
    gray: {
        color: defaultColorVariant.gray900,
    },
    darkGray: {
        color: defaultColorVariant.white,
    },
    white: {
        color: defaultColorVariant.gray700,
    },
};

const inputWrapperStyle = prepareNativeStyle<InputWrapperStyleProps>(
    (utils, { hasError, hasWarning, isLabelMinimized, colorScheme }) => {
        const inputColorSchemeStyles: Record<InputColorScheme, NativeStyleObject> = {
            gray: {
                backgroundColor: utils.colors.gray100,
            },
            darkGray: {
                backgroundColor: utils.colors.gray800,
            },
            white: {
                borderWidth: utils.borders.widths.small,
                borderColor: utils.colors.gray300,
                backgroundColor: utils.colors.white,
            },
        };
        return {
            borderRadius: utils.borders.radii.small,
            paddingVertical: INPUT_WRAPPER_PADDING_VERTICAL,
            paddingHorizontal: INPUT_WRAPPER_PADDING_HORIZONTAL,
            height: 58,
            justifyContent: 'flex-end',
            ...inputColorSchemeStyles[colorScheme],
            extend: [
                {
                    condition: hasWarning,
                    style: {
                        borderColor: utils.colors.yellow,
                        borderWidth: utils.borders.widths.large,
                    },
                },
                {
                    condition: hasError,
                    style: {
                        borderColor: utils.colors.red,
                        backgroundColor: utils.transparentize(0.95, utils.colors.red),
                    },
                },
                {
                    condition: isLabelMinimized,
                    style: {
                        paddingVertical: INPUT_WRAPPER_PADDING_VERTICAL_MINIMIZED,
                    },
                },
            ],
        };
    },
);

const inputStyle = prepareNativeStyle<Pick<InputWrapperStyleProps, 'colorScheme'>>(
    (utils, { colorScheme }) => ({
        ...utils.typography.body,
        alignItems: 'center',
        justifyContent: 'center',
        height: INPUT_TEXT_HEIGHT,
        lineHeight: 0,
        padding: 0,
        ...inputTextColorSchemeStyles[colorScheme],
    }),
);

const inputLabelStyle = prepareNativeStyle<
    Pick<InputWrapperStyleProps, 'isLabelMinimized' | 'colorScheme'>
>((utils, { isLabelMinimized, colorScheme }) => ({
    ...D.deleteKey(utils.typography.body, 'fontSize'),
    position: 'absolute',
    left: INPUT_WRAPPER_PADDING_HORIZONTAL,
    ...inputTextColorSchemeStyles[colorScheme],
    extend: {
        condition: isLabelMinimized,
        style: {
            ...D.deleteKey(utils.typography.label, 'fontSize'),
        },
    },
}));

const leftIconStyle = prepareNativeStyle(() => ({
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 3,
}));

const useAnimationStyles = ({
    isLabelMinimized,
}: Pick<InputWrapperStyleProps, 'isLabelMinimized'>) => {
    const { utils } = useNativeStyles();
    const animatedLabelIsFocusedOrNotEmpty = useSharedValue(isLabelMinimized ? 1 : 0);

    useEffect(() => {
        animatedLabelIsFocusedOrNotEmpty.value = withTiming(!isLabelMinimized ? 1 : 0, {
            duration: 250,
            easing: Easing.inOut(Easing.cubic),
        });
    }, [animatedLabelIsFocusedOrNotEmpty, isLabelMinimized]);

    const animatedInputLabelStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: interpolate(
                    animatedLabelIsFocusedOrNotEmpty.value,
                    [0, 1],
                    [
                        -(INPUT_WRAPPER_PADDING_VERTICAL_MINIMIZED + INPUT_TEXT_HEIGHT),
                        -INPUT_WRAPPER_PADDING_VERTICAL,
                    ],
                ),
            },
        ],
        fontSize: interpolate(
            animatedLabelIsFocusedOrNotEmpty.value,
            [0, 1],
            [utils.typography.label.fontSize, utils.typography.body.fontSize],
        ),
    }));

    return {
        animatedInputLabelStyle,
    };
};

export const Input = React.forwardRef<TextInput, InputProps>(
    (
        {
            value,
            onChange,
            label,
            leftIcon,
            hasError = false,
            hasWarning = false,
            colorScheme = 'white',
        }: InputProps,
        ref,
    ) => {
        const [isFocused, setIsFocused] = useState<boolean>(false);
        const inputRef = useRef<TextInput | null>(null);
        const isLabelMinimized = isFocused || Boolean(value);

        const { applyStyle } = useNativeStyles();
        const { animatedInputLabelStyle } = useAnimationStyles({
            isLabelMinimized,
        });

        const handleInputFocus = () => inputRef?.current?.focus();

        return (
            <Pressable onPress={handleInputFocus}>
                <Box
                    style={applyStyle(inputWrapperStyle, {
                        hasError,
                        hasWarning,
                        isLabelMinimized,
                        colorScheme,
                    })}
                >
                    <Animated.Text
                        style={[
                            /*
                            fontSize has to be defined by the animation style itself.
                            Otherwise, it re-renders and blinks when the size is defined
                            in both places (native and animated style).
                            */
                            animatedInputLabelStyle,
                            applyStyle(inputLabelStyle, { isLabelMinimized, colorScheme }),
                        ]}
                        numberOfLines={1}
                    >
                        {label}
                    </Animated.Text>
                    <Box flexDirection="row" alignItems="center">
                        {leftIcon && <Box style={applyStyle(leftIconStyle)}>{leftIcon}</Box>}
                        <TextInput
                            ref={ref ?? inputRef}
                            value={value}
                            onChangeText={onChange}
                            style={applyStyle(inputStyle, { colorScheme })}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                        />
                    </Box>
                </Box>
            </Pressable>
        );
    },
);
