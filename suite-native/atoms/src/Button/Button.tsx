import { type ReactElement, type ReactNode, useState } from 'react';
import { type PressableProps } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { type MergeExclusive } from 'type-fest';

import {
    type AnimatedIconColor,
    Icon,
    type IconName,
    type IconSize,
    icons,
} from '@suite-native/icons';
import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { type Color, type TypographyStyle, nativeSpacings } from '@trezor/theme';

import { Text } from '../Text';
import { useButtonPressAnimatedStyle } from './useButtonPressAnimatedStyle';
import { Loader } from '../Loader';
import { AnimatedPressable } from '../Pressable';
import { HStack } from '../Stack';
import { type TestProps } from '../types';

// Using ReactElement instead of ReactNode to exclude string and have type check on IconName
// and also because string needs to be rendered in the <Text> element anyway
export type ButtonAccessory = IconName | ReactElement;

export const BUTTON_SIZES = ['tiny', 'extraSmall', 'small', 'medium', 'large'] as const;
export type ButtonSize = (typeof BUTTON_SIZES)[number];

export const BUTTON_COLOR_SCHEMES = [
    'primary',
    'primaryElevation0',
    'secondary',
    'tertiaryElevation0',
    'tertiaryElevation1',
    'redBold',
    'redElevation0',
    'redElevation1',
    'yellowBold',
    'yellowElevation0',
    'yellowElevation1',
    'blueBold',
    'blueElevation0',
    'blueElevation1',
    'backgroundSurfaceElevation0',
] as const;
export type ButtonColorScheme = (typeof BUTTON_COLOR_SCHEMES)[number];

export type ButtonProps = Omit<PressableProps, 'style' | 'onPressIn' | 'onPressOut'> & {
    children: ReactNode;
    colorScheme?: ButtonColorScheme;
    size?: ButtonSize;
    style?: NativeStyleObject;
    isDisabled?: boolean;
    isLoading?: boolean;
    flex?: number;
    isFullWidth?: boolean;
} & MergeExclusive<{ viewLeft?: ButtonAccessory }, { viewRight?: ButtonAccessory }> &
    TestProps;

type ButtonIconProps = {
    iconName: IconName;
    color?: AnimatedIconColor;
    size?: ButtonSize;
};

type ButtonAccessoryViewProps = {
    element: ButtonAccessory;
    iconColor?: AnimatedIconColor;
    iconSize?: ButtonSize;
};

type BaseButtonColorScheme = {
    backgroundColor: Color;
    onPressColor: Color;
    textColor: Color;
    iconColor: Color;
};

type ButtonColorSchemeColors = BaseButtonColorScheme & {
    disabledColors: BaseButtonColorScheme;
};

export type ButtonStyleProps = {
    size: ButtonSize;
    backgroundColor: Color;
    isDisabled: boolean;
    isFullWidth: boolean;
    flex?: number;
};

export type ButtonTextStyleProps = {
    additionalSpacing: number;
    hasLeftView: boolean;
    hasRightView: boolean;
};

const LOADER_FADE_IN_DURATION = 500;

const baseDisabledScheme: BaseButtonColorScheme = {
    backgroundColor: 'backgroundNeutralDisabled',
    onPressColor: 'backgroundNeutralDisabled',
    textColor: 'textDisabled',
    iconColor: 'iconDisabled',
};

export const buttonSchemeToColorsMap = {
    primary: {
        backgroundColor: 'backgroundPrimaryDefault',
        onPressColor: 'backgroundPrimaryPressed',
        textColor: 'textOnPrimary',
        iconColor: 'iconOnPrimary',
        disabledColors: baseDisabledScheme,
    },
    primaryElevation0: {
        backgroundColor: 'backgroundPrimarySubtleOnElevation0',
        onPressColor: 'backgroundPrimarySubtleOnElevation1',
        textColor: 'textPrimaryDefault',
        iconColor: 'iconOnPrimary',
        disabledColors: baseDisabledScheme,
    },
    secondary: {
        backgroundColor: 'backgroundSecondaryDefault',
        onPressColor: 'backgroundSecondaryPressed',
        textColor: 'textOnSecondary',
        iconColor: 'iconOnSecondary',
        disabledColors: baseDisabledScheme,
    },
    tertiaryElevation0: {
        backgroundColor: 'backgroundTertiaryDefaultOnElevation0',
        onPressColor: 'backgroundTertiaryPressedOnElevation0',
        textColor: 'textOnTertiary',
        iconColor: 'iconOnTertiary',
        disabledColors: baseDisabledScheme,
    },
    tertiaryElevation1: {
        backgroundColor: 'backgroundTertiaryDefaultOnElevation1',
        onPressColor: 'backgroundTertiaryPressedOnElevation1',
        textColor: 'textOnTertiary',
        iconColor: 'iconOnTertiary',
        disabledColors: baseDisabledScheme,
    },
    redBold: {
        backgroundColor: 'backgroundAlertRedBold',
        onPressColor: 'backgroundAlertRedBoldAlt',
        textColor: 'textOnRed',
        iconColor: 'iconOnRed',
        disabledColors: baseDisabledScheme,
    },
    redElevation0: {
        backgroundColor: 'backgroundAlertRedSubtleOnElevation0',
        onPressColor: 'backgroundAlertRedSubtleOnElevation1',
        textColor: 'textAlertRed',
        iconColor: 'iconAlertRed',
        disabledColors: baseDisabledScheme,
    },
    redElevation1: {
        backgroundColor: 'backgroundAlertRedSubtleOnElevation1',
        onPressColor: 'backgroundAlertRedSubtleOnElevation1',
        textColor: 'textAlertRed',
        iconColor: 'iconAlertRed',
        disabledColors: baseDisabledScheme,
    },
    yellowBold: {
        backgroundColor: 'backgroundAlertYellowBold',
        onPressColor: 'backgroundAlertYellowBoldAlt',
        textColor: 'textOnYellow',
        iconColor: 'iconOnYellow',
        disabledColors: baseDisabledScheme,
    },
    yellowElevation0: {
        backgroundColor: 'backgroundAlertYellowSubtleOnElevation0',
        onPressColor: 'backgroundAlertYellowSubtleOnElevation1',
        textColor: 'textAlertYellow',
        iconColor: 'iconAlertYellow',
        disabledColors: baseDisabledScheme,
    },
    yellowElevation1: {
        backgroundColor: 'backgroundAlertYellowSubtleOnElevation1',
        onPressColor: 'backgroundAlertYellowSubtleOnElevation1',
        textColor: 'textAlertYellow',
        iconColor: 'iconAlertYellow',
        disabledColors: baseDisabledScheme,
    },
    blueBold: {
        backgroundColor: 'backgroundAlertBlueBold',
        onPressColor: 'backgroundAlertBlueBoldAlt',
        textColor: 'textOnBlue',
        iconColor: 'iconOnBlue',
        disabledColors: baseDisabledScheme,
    },
    blueElevation0: {
        backgroundColor: 'backgroundAlertBlueSubtleOnElevation0',
        onPressColor: 'backgroundAlertBlueSubtleOnElevation1',
        textColor: 'textAlertBlue',
        iconColor: 'iconAlertBlue',
        disabledColors: baseDisabledScheme,
    },
    blueElevation1: {
        backgroundColor: 'backgroundAlertBlueSubtleOnElevation1',
        onPressColor: 'backgroundAlertBlueSubtleOnElevation1',
        textColor: 'textAlertBlue',
        iconColor: 'iconAlertBlue',
        disabledColors: baseDisabledScheme,
    },
    backgroundSurfaceElevation0: {
        backgroundColor: 'backgroundSurfaceElevation0',
        onPressColor: 'backgroundTertiaryPressedOnElevation0',
        textColor: 'textSubdued',
        iconColor: 'textSubdued',
        disabledColors: baseDisabledScheme,
    },
} as const satisfies Record<ButtonColorScheme, ButtonColorSchemeColors>;

export const buttonSizeToDimensionsMap = {
    tiny: {
        minHeight: 20,
        paddingVertical: nativeSpacings.sp2,
        paddingHorizontal: nativeSpacings.sp8,
    },
    extraSmall: {
        minHeight: 36,
        paddingVertical: nativeSpacings.sp8,
        paddingHorizontal: nativeSpacings.sp12,
    },
    small: {
        minHeight: 40,
        paddingVertical: nativeSpacings.sp10,
        paddingHorizontal: nativeSpacings.sp12,
    },
    medium: {
        minHeight: 48,
        paddingVertical: nativeSpacings.sp12,
        paddingHorizontal: nativeSpacings.sp16,
    },
    large: {
        minHeight: 56,
        paddingVertical: nativeSpacings.sp16,
        paddingHorizontal: nativeSpacings.sp20,
    },
} as const satisfies Record<ButtonSize, NativeStyleObject>;

const sizeToAdditionalSpacingMap = {
    tiny: 0,
    extraSmall: 0,
    small: nativeSpacings.sp1,
    medium: nativeSpacings.sp2,
    large: nativeSpacings.sp4,
} as const satisfies Record<ButtonSize, number>;

export const buttonToTextSizeMap = {
    tiny: 'body-xs',
    extraSmall: 'body-sm',
    small: 'body-sm',
    medium: 'body-md',
    large: 'body-md',
} as const satisfies Record<ButtonSize, TypographyStyle>;

export const buttonToIconSizeMap = {
    tiny: 'small',
    extraSmall: 'medium',
    small: 'medium',
    medium: 'mediumLarge',
    large: 'large',
} as const satisfies Record<ButtonSize, IconSize>;

export const buttonStyle = prepareNativeStyle<ButtonStyleProps>(
    (utils, { size, backgroundColor, isDisabled, flex, isFullWidth }) => {
        const sizeDimensions = buttonSizeToDimensionsMap[size];

        return {
            flex,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: utils.borders.radii.round,
            backgroundColor: utils.colors[backgroundColor],
            ...sizeDimensions,
            extend: [
                {
                    condition: isDisabled,
                    style: {
                        backgroundColor: utils.colors.backgroundNeutralDisabled,
                    },
                },
                {
                    condition: isFullWidth,
                    style: {
                        width: '100%',
                    },
                },
            ],
        };
    },
);

const buttonTextStyle = prepareNativeStyle<ButtonTextStyleProps>(
    (_, { additionalSpacing, hasLeftView, hasRightView }) => ({
        marginLeft: !hasLeftView ? additionalSpacing : undefined,
        marginRight: !hasRightView ? additionalSpacing : undefined,
    }),
);

export const ButtonIcon = ({
    iconName,
    color = 'iconDefault',
    size = 'medium',
}: ButtonIconProps) => (
    <Icon.Animated name={iconName} color={color} size={buttonToIconSizeMap[size]} />
);

const isIconName = (value: ButtonAccessory): value is IconName =>
    typeof value === 'string' && value in icons;

// ButtonAccessoryView renders either a ButtonIcon or a provided custom element
// iconColor and iconSize are only used when element is an IconName
export const ButtonAccessoryView = ({
    element,
    iconColor = 'iconDefault',
    iconSize = 'medium',
}: ButtonAccessoryViewProps) => {
    if (isIconName(element)) {
        return <ButtonIcon iconName={element} color={iconColor} size={iconSize} />;
    }

    return element;
};

export const Button = ({
    viewLeft,
    viewRight,
    style,
    children,
    flex,
    colorScheme = 'primary',
    size = 'medium',
    isDisabled = false,
    isLoading = false,
    isFullWidth = false,
    ...pressableProps
}: ButtonProps) => {
    const [isPressed, setIsPressed] = useState(false);
    const { applyStyle } = useNativeStyles();
    const { disabledColors, ...baseColors } = buttonSchemeToColorsMap[colorScheme];
    const { backgroundColor, onPressColor, textColor, iconColor } = isDisabled
        ? disabledColors
        : baseColors;

    const animatedPressStyle = useButtonPressAnimatedStyle(
        isPressed,
        isDisabled,
        backgroundColor,
        onPressColor,
    );

    const handlePressIn = () => setIsPressed(true);
    const handlePressOut = () => setIsPressed(false);

    return (
        <AnimatedPressable
            disabled={isDisabled || isLoading}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            {...pressableProps}
            style={[
                animatedPressStyle,
                applyStyle(buttonStyle, {
                    size,
                    backgroundColor,
                    isDisabled,
                    flex,
                    isFullWidth,
                }),
                style,
            ]}
        >
            {isLoading ? (
                <Animated.View
                    testID={`${pressableProps.testID}/loading`}
                    entering={FadeIn.duration(LOADER_FADE_IN_DURATION)}
                >
                    <Loader color={textColor} />
                </Animated.View>
            ) : (
                <HStack alignItems="center">
                    {viewLeft && (
                        <ButtonAccessoryView
                            element={viewLeft}
                            iconColor={iconColor}
                            iconSize={size}
                        />
                    )}
                    <Text
                        testID={`${pressableProps.testID}/text`}
                        textAlign="center"
                        variant={buttonToTextSizeMap[size]}
                        color={textColor}
                        style={applyStyle(buttonTextStyle, {
                            additionalSpacing: sizeToAdditionalSpacingMap[size],
                            hasLeftView: !!viewLeft,
                            hasRightView: !!viewRight,
                        })}
                    >
                        {children}
                    </Text>
                    {viewRight && (
                        <ButtonAccessoryView
                            element={viewRight}
                            iconColor={iconColor}
                            iconSize={size}
                        />
                    )}
                </HStack>
            )}
        </AnimatedPressable>
    );
};
