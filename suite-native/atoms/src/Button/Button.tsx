import { useState } from 'react';
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

export type ButtonBackgroundElevation = '0' | '1';

export type ButtonSize = 's' | 'm' | 'large';
export type ButtonColorScheme =
    | 'primary'
    | 'secondary'
    | 'tertiaryElevation0'
    | 'tertiaryElevation1'
    | 'dangerElevation0'
    | 'dangerElevation1';

export type ButtonProps = Omit<PressableProps, 'style' | 'onPressIn' | 'onPressOut'> & {
    children: string;
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

type ButtonColorSchemeColors = {
    backgroundColor: Color;
    onPressColor: Color;
    textColor: Color;
    disabledTextColor: Color;
};

export type ButtonStyleProps = {
    size: ButtonSize;
    backgroundColor: Color;
    isDisabled: boolean;
    hasTitle?: boolean;
};

export const buttonSchemeToColorsMap = {
    primary: {
        backgroundColor: 'backgroundPrimaryDefault',
        onPressColor: 'backgroundPrimaryPressed',
        textColor: 'textOnPrimary',
        disabledTextColor: 'textDisabled',
    },
    secondary: {
        backgroundColor: 'backgroundSecondaryDefault',
        onPressColor: 'backgroundSecondaryPressed',
        textColor: 'textOnSecondary',
        disabledTextColor: 'textDisabled',
    },
    tertiaryElevation0: {
        backgroundColor: 'backgroundTertiaryDefaultOnElevation0',
        onPressColor: 'backgroundTertiaryPressedOnElevation0',

        textColor: 'textOnTertiary',
        disabledTextColor: 'textDisabled',
    },
    tertiaryElevation1: {
        backgroundColor: 'backgroundTertiaryDefaultOnElevation1',
        onPressColor: 'backgroundTertiaryPressedOnElevation1',

        textColor: 'textOnTertiary',
        disabledTextColor: 'textDisabled',
    },
    dangerElevation0: {
        backgroundColor: 'backgroundAlertRedSubtleOnElevation0',
        onPressColor: 'backgroundAlertRedSubtleOnElevation0',
        textColor: 'textAlertRed',
        disabledTextColor: 'textDisabled',
    },
    dangerElevation1: {
        backgroundColor: 'backgroundAlertRedSubtleOnElevation1',
        onPressColor: 'backgroundAlertRedSubtleOnElevation1',
        textColor: 'textAlertRed',
        disabledTextColor: 'textDisabled',
    },
} as const satisfies Record<ButtonColorScheme, ButtonColorSchemeColors>;

const sizeToDimensionsMap = {
    s: {
        minHeight: 40,
        paddingVertical: 10,
        paddingHorizontal: nativeSpacings.m,
    },
    m: {
        minHeight: 48,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    large: {
        minHeight: 56,
        paddingVertical: nativeSpacings.m,
        paddingHorizontal: nativeSpacings.large,
    },
} as const satisfies Record<ButtonSize, NativeStyleObject>;

export const buttonToTextSizeMap = {
    s: 'hint',
    m: 'body',
    large: 'body',
} as const satisfies Record<ButtonSize, TypographyStyle>;

const buttonToIconSizeMap = {
    s: 'medium',
    m: 'mediumLarge',
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
    const { backgroundColor, onPressColor, textColor, disabledTextColor } =
        buttonSchemeToColorsMap[colorScheme];

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
        <ButtonIcon
            iconName={iconName}
            color={isDisabled ? disabledTextColor : textColor}
            buttonSize={size}
        />
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
                    <Text
                        textAlign="center"
                        variant={buttonToTextSizeMap[size]}
                        color={isDisabled ? disabledTextColor : textColor}
                    >
                        {children}
                    </Text>
                    {iconRight && icon}
                </HStack>
            </Animated.View>
        </Pressable>
    );
};
