import React, { ReactNode, useEffect, useState } from 'react';
import {
    TextInput,
    NativeSyntheticEvent,
    TextInputProps,
    TextInputFocusEventData,
} from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { D } from '@mobily/ts-belt';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { nativeSpacings } from '@trezor/theme';

import { Box } from '../Box';

export type InputProps = TextInputProps & {
    value: string;
    label: string;
    onSubmitEditing?: (value: string) => void;
    hasError?: boolean;
    hasWarning?: boolean;
    leftIcon?: ReactNode;
};

const INPUT_WRAPPER_PADDING_HORIZONTAL = 14;
const INPUT_WRAPPER_PADDING_VERTICAL = 17;
const INPUT_WRAPPER_PADDING_VERTICAL_MINIMIZED = nativeSpacings.small;
const INPUT_TEXT_HEIGHT = 24;

type InputWrapperStyleProps = {
    hasWarning: boolean;
    hasError: boolean;
    isLabelMinimized: boolean;
};

const inputWrapperStyle = prepareNativeStyle<InputWrapperStyleProps>(
    (utils, { hasError, hasWarning }) => ({
        borderWidth: utils.borders.widths.small,
        borderColor: utils.colors.gray300,
        backgroundColor: utils.colors.gray300,
        borderRadius: utils.borders.radii.small,
        paddingHorizontal: INPUT_WRAPPER_PADDING_HORIZONTAL,
        paddingBottom: INPUT_WRAPPER_PADDING_VERTICAL_MINIMIZED,
        height: 58,
        justifyContent: 'flex-end',
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
        ],
    }),
);

const inputStyle = prepareNativeStyle(utils => ({
    ...utils.typography.body,
    alignItems: 'center',
    justifyContent: 'center',
    height: INPUT_TEXT_HEIGHT + INPUT_WRAPPER_PADDING_VERTICAL,
    color: utils.colors.gray700,
    lineHeight: 0,
    borderWidth: 0,
    flex: 1,
    paddingTop: INPUT_WRAPPER_PADDING_VERTICAL,
}));

const inputHitSlop = {
    left: INPUT_WRAPPER_PADDING_HORIZONTAL,
    right: INPUT_WRAPPER_PADDING_HORIZONTAL,
    top: INPUT_WRAPPER_PADDING_VERTICAL_MINIMIZED,
    bottom: INPUT_WRAPPER_PADDING_VERTICAL,
};

const inputLabelStyle = prepareNativeStyle(
    (utils, { isLabelMinimized }: Pick<InputWrapperStyleProps, 'isLabelMinimized'>) => ({
        ...D.deleteKey(utils.typography.body, 'fontSize'),
        color: utils.colors.gray600,
        position: 'absolute',
        left: INPUT_WRAPPER_PADDING_HORIZONTAL,
        extend: {
            condition: isLabelMinimized,
            style: {
                ...D.deleteKey(utils.typography.label, 'fontSize'),
            },
        },
    }),
);

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
            onFocus,
            onBlur,
            onSubmitEditing,
            label,
            leftIcon,
            hasError = false,
            hasWarning = false,
            ...props
        }: InputProps,
        ref,
    ) => {
        const [isFocused, setIsFocused] = useState<boolean>(false);
        const isLabelMinimized = isFocused || !!value?.length;

        const { applyStyle } = useNativeStyles();
        const { animatedInputLabelStyle } = useAnimationStyles({
            isLabelMinimized,
        });

        const handleOnFocus = (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
            setIsFocused(true);
            onFocus?.(event);
        };

        const handleOnBlur = (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
            setIsFocused(false);
            onBlur?.(event);
        };

        return (
            <Box
                style={applyStyle(inputWrapperStyle, {
                    hasError,
                    hasWarning,
                    isLabelMinimized,
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
                        applyStyle(inputLabelStyle, { isLabelMinimized }),
                    ]}
                    numberOfLines={1}
                >
                    {label}
                </Animated.Text>
                <Box flexDirection="row" alignItems="center">
                    {leftIcon && <Box style={applyStyle(leftIconStyle)}>{leftIcon}</Box>}
                    <TextInput
                        ref={ref}
                        style={applyStyle(inputStyle)}
                        onFocus={handleOnFocus}
                        onBlur={handleOnBlur}
                        hitSlop={inputHitSlop}
                        value={value}
                        {...props}
                    />
                </Box>
            </Box>
        );
    },
);
