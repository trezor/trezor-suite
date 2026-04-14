import { type ReactNode, forwardRef, useEffect, useState } from 'react';
import {
    type NativeSyntheticEvent,
    Platform,
    type TargetedEvent,
    TextInput,
    type TextInputProps,
} from 'react-native';
import { type TextInput as GHTextInput } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { D, G, S } from '@mobily/ts-belt';
import { type RequireOneOrNone } from 'type-fest';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { nativeSpacings } from '@trezor/theme';

import { Box } from '../Box';
import { ACCESSIBILITY_FONTSIZE_MULTIPLIER, Text } from '../Text';
import { type SurfaceElevation } from '../types';

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
            keepPlaceholderOnFocus?: boolean;
            asBottomSheetInput?: boolean;
        },
        'label' | 'placeholder'
    >;

export type InputType = TextInput | GHTextInput;

const INPUT_VERTICAL_PADDING =
    Platform.OS == 'android' ? nativeSpacings.sp16 - 2 : nativeSpacings.sp16;
const INPUT_WITH_LABEL_BOTTOM_PADDING =
    Platform.OS == 'android' ? nativeSpacings.sp4 : nativeSpacings.sp8;
const INPUT_LABEL_TOP_PADDING = nativeSpacings.sp32;
const INPUT_LABEL_TOP_PADDING_MINIMIZED = INPUT_LABEL_TOP_PADDING + nativeSpacings.sp8;
const INPUT_WRAPPER_PADDING_HORIZONTAL = nativeSpacings.sp16 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const INPUT_WRAPPER_PADDING_VERTICAL = nativeSpacings.sp16 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
const INPUT_WRAPPER_PADDING_VERTICAL_MINIMIZED =
    nativeSpacings.sp8 * ACCESSIBILITY_FONTSIZE_MULTIPLIER;
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
            ? utils.colors.legacyBackgroundNeutralSubtleOnElevation1
            : utils.colors.legacyBackgroundNeutralSubtleOnElevation0,
        borderColor: isDisabled
            ? utils.colors.legacyBackgroundNeutralSubtleOnElevation1
            : utils.colors.elementBorderField,
        borderWidth: utils.borders.widths.small,
        borderRadius: utils.borders.radii.r12,
        margin: utils.borders.widths.small,
        paddingHorizontal: INPUT_WRAPPER_PADDING_HORIZONTAL,
        justifyContent: 'flex-end',
        extend: [
            {
                condition: isFocused,
                style: {
                    borderColor: utils.colors.elementBorderFieldFocused,
                    borderWidth: utils.borders.widths.large,
                    margin: 0,
                },
            },
            {
                condition: hasWarning,
                style: {
                    borderColor: utils.colors.legacyBackgroundAlertYellowBold,
                    borderWidth: utils.borders.widths.large,
                },
            },
            {
                condition: hasError,
                style: {
                    borderColor: utils.colors.elementBorderFieldError,
                    backgroundColor: utils.colors.legacyBackgroundAlertRedSubtleOnElevation1,
                },
            },
            {
                condition: elevation === '1',
                style: {
                    borderColor: utils.colors.legacyBackgroundNeutralSubtleOnElevation1,
                    backgroundColor: utils.colors.legacyBackgroundNeutralSubtleOnElevation1,
                },
            },
        ],
    }),
);

const inputStyle = prepareNativeStyle<InputStyleProps>(
    (utils, { isLabelDisplayed, isLeftIconDisplayed, isRightIconDisplayed, isDisabled }) => {
        const paddingTop = isLabelDisplayed ? utils.spacings.sp24 : INPUT_VERTICAL_PADDING;
        const paddingBottom = isLabelDisplayed
            ? INPUT_WITH_LABEL_BOTTOM_PADDING
            : INPUT_VERTICAL_PADDING;
        const minHeight = INPUT_TEXT_HEIGHT + paddingTop + paddingBottom;

        return {
            ...utils.typography['body-md'],
            // letterSpacing from `typography['body-md']` is making strange layout jumps on Android while filling the input.
            // This resets it to the default TextInput value.
            letterSpacing: 0,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight,
            color: isDisabled ? utils.colors.contentSecondary : utils.colors.contentPrimary,
            left: isLeftIconDisplayed ? utils.spacings.sp24 : 0,
            paddingRight: isRightIconDisplayed ? 40 : 0,
            borderWidth: 0,
            flex: 1,
            // Make the text input uniform on both platforms (https://stackoverflow.com/a/68458803/1281305)
            paddingTop,
            paddingBottom,
        };
    },
);

const inputHitSlop = {
    left: INPUT_WRAPPER_PADDING_HORIZONTAL,
    right: INPUT_WRAPPER_PADDING_HORIZONTAL,
    top: INPUT_WRAPPER_PADDING_VERTICAL,
    bottom: INPUT_WRAPPER_PADDING_VERTICAL,
};

const labelStyle = prepareNativeStyle(
    (utils, { isLabelMinimized, isLeftIconDisplayed }: InputLabelStyleProps) => ({
        ...D.deleteKey(utils.typography['body-md'], 'fontSize'),
        color: utils.colors.contentSecondary,
        position: 'absolute',
        top: INPUT_LABEL_TOP_PADDING,
        left: INPUT_WRAPPER_PADDING_HORIZONTAL + (isLeftIconDisplayed ? utils.spacings.sp24 : 0),
        extend: {
            condition: isLabelMinimized,
            style: {
                ...D.deleteKey(utils.typography['body-xs'], 'fontSize'),
                top: INPUT_LABEL_TOP_PADDING_MINIMIZED,
            },
        },
    }),
);

const placeholderStyle = prepareNativeStyle(
    (utils, { isLeftIconDisplayed }: InputLabelStyleProps) => ({
        position: 'absolute',
        top: INPUT_VERTICAL_PADDING + utils.borders.widths.large,
        left: INPUT_WRAPPER_PADDING_HORIZONTAL + (isLeftIconDisplayed ? utils.spacings.sp24 : 0),
        color: utils.colors.contentSecondary,
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
    left: utils.spacings.sp8,
}));

const rightIconStyle = prepareNativeStyle(utils => ({
    right: utils.spacings.sp16,
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
            [utils.typography['body-xs'].fontSize, utils.typography['body-md'].fontSize],
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
            editable,
            hasError = false,
            hasWarning = false,
            elevation = '0',
            keepPlaceholderOnFocus = false,
            asBottomSheetInput = false,
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
        // BottomSheetTextInput allows to avoid keyboard by expanding BottomSheet
        const InputComponent = asBottomSheetInput ? BottomSheetTextInput : TextInput;

        const handleOnFocus = (event: NativeSyntheticEvent<TargetedEvent>) => {
            setIsFocused(true);
            onFocus?.(event);
        };

        const handleOnBlur = (event: NativeSyntheticEvent<TargetedEvent>) => {
            setIsFocused(false);
            onBlur?.(event);
        };

        const shouldShowPlaceholder = keepPlaceholderOnFocus
            ? S.isEmpty(value)
            : !isFocused && S.isEmpty(value);

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
                    {shouldShowPlaceholder && placeholder && (
                        <Animated.View
                            entering={labelEnteringAnimation}
                            exiting={labelExitingAnimation}
                            style={applyStyle(placeholderStyle, {
                                isLabelMinimized,
                                isLeftIconDisplayed,
                            })}
                        >
                            <Text color="contentSecondary">{placeholder}</Text>
                        </Animated.View>
                    )}
                    <Box flexDirection="row" alignItems="center">
                        <InputComponent
                            ref={ref as any}
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
