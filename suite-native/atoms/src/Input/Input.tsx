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

import { Icon, type IconName, isIconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { nativeSpacings } from '@trezor/theme';

import { Box } from '../Box';
import { ACCESSIBILITY_FONTSIZE_MULTIPLIER, Text } from '../Text';

const LABEL_ANIMATION_DURATION = 200;
const labelEnteringAnimation = FadeIn.duration(LABEL_ANIMATION_DURATION);
const labelExitingAnimation = FadeOut.duration(LABEL_ANIMATION_DURATION);

type InputBaseProps = {
    value: string;
    hasError?: boolean;
    hasWarning?: boolean;
    rightIcon?: IconName | ReactNode;
    asBottomSheetInput?: boolean;
};

export type TextInputType = 'innerLabel' | 'outsideLabel' | 'noLabel';

// Placeholder and label combinations defined per label type.
export type InputLabelVariantProps =
    | { labelType?: 'innerLabel'; label?: string; placeholder?: never }
    | { labelType: 'outsideLabel'; label?: string; placeholder?: string }
    | { labelType: 'noLabel'; label?: never; placeholder?: string };

export type InputProps = TextInputProps & InputBaseProps & InputLabelVariantProps;

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
};

type InputLabelStyleProps = {
    isLabelMinimized: boolean;
};

type InputStyleProps = {
    isInnerLabelDisplayed: boolean;
    isRightIconDisplayed: boolean;
    isDisabled: boolean;
};

const inputWrapperStyle = prepareNativeStyle<InputWrapperStyleProps>(
    (utils, { hasError, hasWarning, isDisabled, isFocused }) => ({
        backgroundColor: isDisabled
            ? utils.colors.elementFillFieldDisabled
            : utils.colors.elementFillField,
        borderColor: isDisabled
            ? utils.colors.elementBorderFieldDisabled
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
                    borderColor: utils.colors.borderWarning,
                    borderWidth: utils.borders.widths.large,
                },
            },
            {
                condition: hasError,
                style: {
                    borderColor: utils.colors.elementBorderFieldError,
                    backgroundColor: utils.colors.borderCritical,
                },
            },
        ],
    }),
);

const inputStyle = prepareNativeStyle<InputStyleProps>(
    (utils, { isInnerLabelDisplayed, isRightIconDisplayed, isDisabled }) => {
        const paddingTop = isInnerLabelDisplayed ? utils.spacings.sp24 : INPUT_VERTICAL_PADDING;
        const paddingBottom = isInnerLabelDisplayed
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
            left: 0,
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

const labelStyle = prepareNativeStyle((utils, { isLabelMinimized }: InputLabelStyleProps) => ({
    ...D.deleteKey(utils.typography['body-md'], 'fontSize'),
    color: utils.colors.contentSecondary,
    position: 'absolute',
    top: INPUT_LABEL_TOP_PADDING,
    left: INPUT_WRAPPER_PADDING_HORIZONTAL,
    extend: {
        condition: isLabelMinimized,
        style: {
            ...D.deleteKey(utils.typography['body-xs'], 'fontSize'),
            top: INPUT_LABEL_TOP_PADDING_MINIMIZED,
        },
    },
}));

const placeholderStyle = prepareNativeStyle(utils => ({
    position: 'absolute',
    top: INPUT_VERTICAL_PADDING + utils.borders.widths.small,
    left: utils.spacings.sp16 + utils.borders.widths.large + utils.borders.widths.small,
    color: utils.colors.contentSecondary,
}));

const iconStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    height: '100%',
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
            rightIcon,
            style,
            editable,
            labelType = 'innerLabel',
            hasError = false,
            hasWarning = false,
            asBottomSheetInput = false,
            ...props
        }: InputProps,
        ref,
    ) => {
        const [isFocused, setIsFocused] = useState<boolean>(false);
        const isInnerLabelDisplayed = labelType === 'innerLabel' && !!label;
        const isLabelMinimized = isFocused || !!value?.length;
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

        const shouldShowPlaceholder = !!placeholder && S.isEmpty(value);

        return (
            <>
                <Box
                    style={applyStyle(inputWrapperStyle, {
                        hasError,
                        hasWarning,
                        isLabelMinimized,
                        isDisabled,
                        isFocused,
                    })}
                >
                    {isInnerLabelDisplayed && (
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
                                }),
                            ]}
                            numberOfLines={1}
                        >
                            {label}
                        </Animated.Text>
                    )}
                    {shouldShowPlaceholder && (
                        <Animated.View
                            entering={labelEnteringAnimation}
                            exiting={labelExitingAnimation}
                            style={applyStyle(placeholderStyle)}
                        >
                            <Text color="contentSecondary">{placeholder}</Text>
                        </Animated.View>
                    )}
                    <Box flexDirection="row" alignItems="center">
                        <InputComponent
                            ref={ref as any}
                            style={[
                                applyStyle(inputStyle, {
                                    isInnerLabelDisplayed,
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
                    {!!rightIcon && (
                        <Box style={[applyStyle(iconStyle), applyStyle(rightIconStyle)]}>
                            {isIconName(rightIcon) ? <Icon name={rightIcon} /> : rightIcon}
                        </Box>
                    )}
                </Box>
            </>
        );
    },
);
