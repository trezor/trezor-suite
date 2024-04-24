import { ReactNode, useState } from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { MergeExclusive } from 'type-fest';

import { Color, TypographyStyle, nativeSpacings } from '@trezor/theme';
import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon, IconColor, IconName, IconSize } from '@suite-common/icons';

import { Text } from '../Text';
import { useButtonPressAnimatedStyle } from './useButtonPressAnimatedStyle';
import { TestProps } from '../types';
import { HStack } from '../Stack';

export type ButtonSize = 'extraSmall' | 'small' | 'medium' | 'large';
export type ButtonColorScheme =
    | 'primary'
    | 'secondary'
    | 'tertiaryElevation0'
    | 'tertiaryElevation1'
    | 'redBold'
    | 'redElevation0'
    | 'redElevation1'
    | 'yellowBold'
    | 'yellowElevation0'
    | 'yellowElevation1'
    | 'blueBold'
    | 'blueElevation0'
    | 'blueElevation1';

export type ButtonProps = Omit<PressableProps, 'style' | 'onPressIn' | 'onPressOut'> & {
    children: ReactNode;
    colorScheme?: ButtonColorScheme;
    size?: ButtonSize;
    style?: NativeStyleObject;
    isDisabled?: boolean;
} & MergeExclusive<{ iconLeft?: IconName }, { iconRight?: IconName }> &
    TestProps;

type ButtonIconProps = {
    iconName: IconName;
    color: IconColor;
    buttonSize: ButtonSize;
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
    hasTitle?: boolean;
};

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
} as const satisfies Record<ButtonColorScheme, ButtonColorSchemeColors>;

const sizeToDimensionsMap = {
    extraSmall: {
        minHeight: 36,
        paddingVertical: nativeSpacings.small,
        paddingHorizontal: 12,
    },
    small: {
        minHeight: 40,
        paddingVertical: 10,
        paddingHorizontal: nativeSpacings.medium,
    },
    medium: {
        minHeight: 48,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    large: {
        minHeight: 56,
        paddingVertical: nativeSpacings.medium,
        paddingHorizontal: nativeSpacings.large,
    },
} as const satisfies Record<ButtonSize, NativeStyleObject>;

export const buttonToTextSizeMap = {
    extraSmall: 'hint',
    small: 'hint',
    medium: 'body',
    large: 'body',
} as const satisfies Record<ButtonSize, TypographyStyle>;

const buttonToIconSizeMap = {
    extraSmall: 'medium',
    small: 'medium',
    medium: 'mediumLarge',
    large: 'large',
} as const satisfies Record<ButtonSize, IconSize>;

export const buttonStyle = prepareNativeStyle<ButtonStyleProps>(
    (utils, { size, backgroundColor, isDisabled }) => {
        const sizeDimensions = sizeToDimensionsMap[size];

        return {
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
            ],
        };
    },
);

export const ButtonIcon = ({ iconName, color, buttonSize }: ButtonIconProps) => (
    <Icon name={iconName} color={color} size={buttonToIconSizeMap[buttonSize]} />
);

export const Button = ({
    iconLeft,
    iconRight,
    style,
    children,
    colorScheme = 'primary',
    size = 'medium',
    isDisabled = false,
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

    const iconName = iconLeft || iconRight;
    const icon = iconName ? (
        <ButtonIcon iconName={iconName} color={iconColor} buttonSize={size} />
    ) : null;

    return (
        <Pressable
            disabled={isDisabled}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            {...pressableProps}
        >
            <Animated.View
                style={[
                    animatedPressStyle,
                    applyStyle(buttonStyle, {
                        size,
                        backgroundColor,
                        isDisabled,
                    }),
                    style,
                ]}
            >
                <HStack alignItems="center">
                    {iconLeft && icon}
                    <Text textAlign="center" variant={buttonToTextSizeMap[size]} color={textColor}>
                        {children}
                    </Text>
                    {iconRight && icon}
                </HStack>
            </Animated.View>
        </Pressable>
    );
};
