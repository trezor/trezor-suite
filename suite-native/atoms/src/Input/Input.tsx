import { forwardRef, ReactNode, useEffect, useState } from 'react';
import {
    TextInput,
    NativeSyntheticEvent,
    TextInputProps,
    TextInputFocusEventData,
} from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { RequireOneOrNone } from 'type-fest';
import { D, G, S } from '@mobily/ts-belt';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { nativeSpacings } from '@trezor/theme';

import { Box } from '../Box';
import { ACCESSIBILITY_FONTSIZE_MULTIPLIER, Text } from '../Text';
import { SurfaceElevation } from '../types';

const LABEL_ANIMATION_DURATION = 200;
const labelEnteringAnimation = FadeIn.duration(LABEL_ANIMATION_DURATION);
const labelExitingAnimation = FadeOut.duration(LABEL_ANIMATION_DURATION);

export type InputProps = TextInputProps &
    RequireOneOrNone<
        {
            value: string;
            label: string;
            placeholder: string;
            hasError?: boolean;
            hasWarning?: boolean;
            leftIcon?: ReactNode;
            rightIcon?: ReactNode;
            elevation?: SurfaceElevation;
        },
        'label' | 'placeholder'
    >;

const INPUT_LABEL_TOP_PADDING = 35;
const INPUT_LABEL_TOP_PADDING_MINIMIZED = 37;
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
    isFocused: boolean;
    elevation: SurfaceElevation;
};

type InputLabelStyleProps = {
    isLabelMinimized: boolean;
    isLeftIconDisplayed: boolean;
};

type InputStyleProps = {
    isLeftIconDisplayed: boolean;
    isRightIconDisplayed: boolean;
    isDisabled: boolean;
};

const inputWrapperStyle = prepareNativeStyle<InputWrapperStyleProps>(
    (utils, { hasError, hasWarning, isFocused, elevation }) => ({
        backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation0,
        borderColor: utils.colors.backgroundNeutralSubtleOnElevation1,
        borderWidth: utils.borders.widths.small,
        borderRadius: 1.5 * utils.borders.radii.small,
        paddingHorizontal: INPUT_WRAPPER_PADDING_HORIZONTAL,
        minHeight: INPUT_WRAPPER_HEIGHT,
        justifyContent: 'flex-end',
        extend: [
            {
                condition: isFocused,
                style: {
                    borderColor: utils.colors.borderFocus,
                },
            },
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
            {
                condition: elevation === '1',
                style: {
                    borderColor: utils.colors.backgroundNeutralSubtleOnElevation1,
                    backgroundColor: utils.colors.backgroundNeutralSubtleOnElevation1,
                },
            },
        ],
    }),
);

const inputStyle = prepareNativeStyle<InputStyleProps>(
    (utils, { isLeftIconDisplayed, isRightIconDisplayed, isDisabled }) => ({
        ...utils.typography.body,
        // letterSpacing from `typography.body` is making strange layout jumps on Android while filling the input.
        // This resets it to the default TextInput value.
        letterSpacing: 0,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: INPUT_TEXT_HEIGHT,
        color: isDisabled ? utils.colors.textSubdued : utils.colors.textDefault,
        left: isLeftIconDisplayed ? utils.spacings.large : 0,
        paddingRight: isRightIconDisplayed ? 40 : 0,
        borderWidth: 0,
        flex: 1,
        // Make the text input uniform on both platforms (https://stackoverflow.com/a/68458803/1281305)
        paddingVertical: utils.spacings.medium,
    }),
);

const inputHitSlop = {
    left: INPUT_WRAPPER_PADDING_HORIZONTAL,
    right: INPUT_WRAPPER_PADDING_HORIZONTAL,
    top: INPUT_WRAPPER_PADDING_VERTICAL,
    bottom: INPUT_WRAPPER_PADDING_VERTICAL,
};

const labelStyle = prepareNativeStyle(
    (utils, { isLabelMinimized, isLeftIconDisplayed }: InputLabelStyleProps) => ({
        ...D.deleteKey(utils.typography.body, 'fontSize'),
        color: utils.colors.textSubdued,
        position: 'absolute',
        left: INPUT_WRAPPER_PADDING_HORIZONTAL + (isLeftIconDisplayed ? utils.spacings.large : 0),
        top: INPUT_LABEL_TOP_PADDING,
        extend: {
            condition: isLabelMinimized,
            style: {
                ...D.deleteKey(utils.typography.label, 'fontSize'),
                top: INPUT_LABEL_TOP_PADDING_MINIMIZED,
            },
        },
    }),
);

const placeholderStyle = prepareNativeStyle(
    (utils, { isLeftIconDisplayed }: InputLabelStyleProps) => ({
        position: 'absolute',
        height: INPUT_WRAPPER_HEIGHT,
        color: utils.colors.textSubdued,
        left: INPUT_WRAPPER_PADDING_HORIZONTAL + (isLeftIconDisplayed ? utils.spacings.large : 0),
        justifyContent: 'center',
    }),
);

const iconStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    height: '100%',
}));

const leftIconStyle = prepareNativeStyle(utils => ({
    marginRight: 3,
    left: utils.spacings.small,
}));

const rightIconStyle = prepareNativeStyle(utils => ({
    right: utils.spacings.medium,
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

export const Input = forwardRef<TextInput, InputProps>(
    (
        {
            value,
            onFocus,
            onBlur,
            label,
            placeholder,
            leftIcon,
            rightIcon,
            style,
            hasError = false,
            hasWarning = false,
            elevation = '0',
            editable,
            ...props
        }: InputProps,
        ref,
    ) => {
        const [isFocused, setIsFocused] = useState<boolean>(false);
        const isLabelMinimized = isFocused || !!value?.length;
        const isLeftIconDisplayed = !!leftIcon;
        const isRightIconDisplayed = !!rightIcon;

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
            <>
                <Box
                    style={applyStyle(inputWrapperStyle, {
                        hasError,
                        hasWarning,
                        isLabelMinimized,
                        isFocused,
                        elevation,
                    })}
                >
                    {leftIcon && (
                        <Box style={[applyStyle(iconStyle), applyStyle(leftIconStyle)]}>
                            {leftIcon}
                        </Box>
                    )}
                    {label && (
                        <Animated.Text
                            style={[
                                /*
                            fontSize has to be defined by the animation style itself.
                            Otherwise, it re-renders and blinks when the size is defined
                            in both places (native and animated style).
                            */
                                animatedInputLabelStyle,
                                applyStyle(labelStyle, {
                                    isLabelMinimized,
                                    isLeftIconDisplayed,
                                }),
                            ]}
                            numberOfLines={1}
                        >
                            {label}
                        </Animated.Text>
                    )}
                    {!isFocused && S.isEmpty(value) && placeholder && (
                        <Animated.View
                            entering={labelEnteringAnimation}
                            exiting={labelExitingAnimation}
                            style={applyStyle(placeholderStyle, {
                                isLabelMinimized,
                                isLeftIconDisplayed,
                            })}
                        >
                            <Text color="textSubdued">{placeholder}</Text>
                        </Animated.View>
                    )}
                    <Box flexDirection="row" alignItems="center">
                        <TextInput
                            ref={ref}
                            style={[
                                applyStyle(inputStyle, {
                                    isLeftIconDisplayed,
                                    isRightIconDisplayed,
                                    isDisabled: G.isBoolean(editable) && !editable,
                                }),
                                style,
                            ]}
                            onFocus={handleOnFocus}
                            onBlur={handleOnBlur}
                            hitSlop={inputHitSlop}
                            value={value}
                            editable={editable}
                            {...props}
                        />
                    </Box>
                    {rightIcon && (
                        <Box style={[applyStyle(iconStyle), applyStyle(rightIconStyle)]}>
                            <Box style={{}}>{rightIcon}</Box>
                        </Box>
                    )}
                </Box>
            </>
        );
    },
);
