import { forwardRef, ReactNode, useEffect, useState } from 'react';
import {
    TextInput,
    NativeSyntheticEvent,
    TextInputProps,
    TextInputFocusEventData,
    Platform,
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

const INPUT_VERTICAL_PADDING =
    Platform.OS == 'android' ? nativeSpacings.medium - 2 : nativeSpacings.medium;
const INPUT_WITH_LABEL_BOTTOM_PADDING =
    Platform.OS == 'android' ? nativeSpacings.extraSmall : nativeSpacings.small;
const INPUT_LABEL_TOP_PADDING = nativeSpacings.extraLarge;
const INPUT_LABEL_TOP_PADDING_MINIMIZED = INPUT_LABEL_TOP_PADDING + nativeSpacings.small;
const INPUT_WRAPPER_PADDING_HORIZONTAL = nativeSpacings.medium * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const INPUT_WRAPPER_PADDING_VERTICAL = nativeSpacings.medium * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const INPUT_WRAPPER_PADDING_VERTICAL_MINIMIZED =
    nativeSpacings.small * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const INPUT_TEXT_HEIGHT = 24 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;

type InputWrapperStyleProps = {
    hasWarning: boolean;
    hasError: boolean;
    isLabelMinimized: boolean;
    isDisabled: boolean;
    isFocused: boolean;
    elevation: SurfaceElevation;
};

type InputLabelStyleProps = {
    isLabelMinimized: boolean;
    isLeftIconDisplayed: boolean;
};

type InputStyleProps = {
    isLabelDisplayed: boolean;
    isLeftIconDisplayed: boolean;
    isRightIconDisplayed: boolean;
    isDisabled: boolean;
};

const inputWrapperStyle = prepareNativeStyle<InputWrapperStyleProps>(
    (utils, { hasError, hasWarning, isDisabled, isFocused, elevation }) => ({
        backgroundColor: isDisabled
            ? utils.colors.backgroundNeutralSubtleOnElevation1
            : utils.colors.backgroundNeutralSubtleOnElevation0,
        borderColor: isDisabled
            ? utils.colors.backgroundNeutralSubtleOnElevation1
            : utils.colors.borderInputDefault,
        borderWidth: utils.borders.widths.small,
        borderRadius: 1.5 * utils.borders.radii.small,
        margin: utils.borders.widths.small,
        paddingHorizontal: INPUT_WRAPPER_PADDING_HORIZONTAL,
        justifyContent: 'flex-end',
        extend: [
            {
                condition: isFocused,
                style: {
                    borderColor: utils.colors.borderInputFocus,
                    borderWidth: utils.borders.widths.large,
                    margin: 0,
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
    (utils, { isLabelDisplayed, isLeftIconDisplayed, isRightIconDisplayed, isDisabled }) => ({
        ...utils.typography.body,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: INPUT_TEXT_HEIGHT,
        color: isDisabled ? utils.colors.textSubdued : utils.colors.textDefault,
        left: isLeftIconDisplayed ? utils.spacings.large : 0,
        paddingRight: isRightIconDisplayed ? 40 : 0,
        borderWidth: 0,
        flex: 1,
        // Make the text input uniform on both platforms (https://stackoverflow.com/a/68458803/1281305)
        paddingTop: isLabelDisplayed ? utils.spacings.large : INPUT_VERTICAL_PADDING,
        paddingBottom: isLabelDisplayed ? INPUT_WITH_LABEL_BOTTOM_PADDING : INPUT_VERTICAL_PADDING,
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
        top: INPUT_LABEL_TOP_PADDING,
        left: INPUT_WRAPPER_PADDING_HORIZONTAL + (isLeftIconDisplayed ? utils.spacings.large : 0),
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
        top: INPUT_VERTICAL_PADDING + utils.borders.widths.large,
        left: INPUT_WRAPPER_PADDING_HORIZONTAL + (isLeftIconDisplayed ? utils.spacings.large : 0),
        color: utils.colors.textSubdued,
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
        const isLabelDisplayed = !!label;
        const isLabelMinimized = isFocused || !!value?.length;
        const isLeftIconDisplayed = !!leftIcon;
        const isRightIconDisplayed = !!rightIcon;
        const isDisabled = G.isBoolean(editable) && !editable;

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
                        isDisabled,
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
                                    isLabelDisplayed,
                                    isLeftIconDisplayed,
                                    isRightIconDisplayed,
                                    isDisabled,
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
                            {rightIcon}
                        </Box>
                    )}
                </Box>
            </>
        );
    },
);
