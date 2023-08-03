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
import { ACCESSIBILITY_FONTSIZE_MULTIPLIER } from '../Text';

export type InputProps = TextInputProps & {
    value: string;
    label: string;
    onSubmitEditing?: (value: string) => void;
    hasError?: boolean;
    hasWarning?: boolean;
    leftIcon?: ReactNode;
};

const INPUT_WRAPPER_PADDING_HORIZONTAL = 14 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const INPUT_WRAPPER_PADDING_VERTICAL = 17 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const INPUT_WRAPPER_PADDING_VERTICAL_MINIMIZED =
    nativeSpacings.small * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const INPUT_TEXT_HEIGHT = 24 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const INPUT_WRAPPER_HEIGHT = 58 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;

type InputWrapperStyleProps = {
    hasWarning: boolean;
    hasError: boolean;
    isLabelMinimized: boolean;
};

type InputLabelStyleProps = {
    isLabelMinimized: boolean;
    isIconDisplayed: boolean;
};

type InputStyleProps = {
    isIconDisplayed: boolean;
};

const inputWrapperStyle = prepareNativeStyle<InputWrapperStyleProps>(
    (utils, { hasError, hasWarning }) => ({
        borderWidth: utils.borders.widths.small,
        borderColor: utils.colors.borderOnElevation0,
        backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation0,
        borderRadius: utils.borders.radii.small,
        paddingHorizontal: INPUT_WRAPPER_PADDING_HORIZONTAL,
        paddingBottom: INPUT_WRAPPER_PADDING_VERTICAL_MINIMIZED,
        height: INPUT_WRAPPER_HEIGHT,
        justifyContent: 'flex-end',
        extend: [
            {
                condition: hasWarning,
                style: {
                    borderColor: utils.colors.backgroundAlertYellowBold,
                    borderWidth: utils.borders.widths.large,
                },
            },
            {
                condition: hasError,
                style: {
                    borderColor: utils.colors.borderAlertRed,
                    backgroundColor: utils.colors.backgroundAlertRedSubtleOnElevation1,
                },
            },
        ],
    }),
);

const inputStyle = prepareNativeStyle<InputStyleProps>((utils, { isIconDisplayed }) => ({
    ...utils.typography.body,
    alignItems: 'center',
    justifyContent: 'center',
    height: INPUT_TEXT_HEIGHT,
    color: utils.colors.textDefault,
    left: isIconDisplayed ? utils.spacings.large : 0,
    borderWidth: 0,
    flex: 1,
    // Make the text input uniform on both platforms (https://stackoverflow.com/a/68458803/1281305)
    paddingTop: 0,
    paddingBottom: 0,
}));

const inputHitSlop = {
    left: INPUT_WRAPPER_PADDING_HORIZONTAL,
    right: INPUT_WRAPPER_PADDING_HORIZONTAL,
    top: INPUT_WRAPPER_PADDING_VERTICAL,
    bottom: INPUT_WRAPPER_PADDING_VERTICAL,
};

const inputLabelStyle = prepareNativeStyle(
    (utils, { isLabelMinimized, isIconDisplayed }: InputLabelStyleProps) => ({
        ...D.deleteKey(utils.typography.body, 'fontSize'),
        color: utils.colors.textSubdued,
        position: 'absolute',
        left: INPUT_WRAPPER_PADDING_HORIZONTAL + (isIconDisplayed ? utils.spacings.large : 0),
        extend: {
            condition: isLabelMinimized,
            style: {
                ...D.deleteKey(utils.typography.label, 'fontSize'),
            },
        },
    }),
);

const leftIconStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 3,
    top: 15,
    left: utils.spacings.small,
}));

const useInputLabelAnimationStyles = ({
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
        const isIconDisplayed = !!leftIcon;

        const { applyStyle } = useNativeStyles();
        const { animatedInputLabelStyle } = useInputLabelAnimationStyles({
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
                {leftIcon && <Box style={applyStyle(leftIconStyle)}>{leftIcon}</Box>}
                <Animated.Text
                    style={[
                        /*
                            fontSize has to be defined by the animation style itself.
                            Otherwise, it re-renders and blinks when the size is defined
                            in both places (native and animated style).
                            */
                        animatedInputLabelStyle,
                        applyStyle(inputLabelStyle, { isLabelMinimized, isIconDisplayed }),
                    ]}
                    numberOfLines={1}
                >
                    {label}
                </Animated.Text>
                <Box flexDirection="row" alignItems="center">
                    <TextInput
                        ref={ref}
                        style={applyStyle(inputStyle, { isIconDisplayed })}
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
