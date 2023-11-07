import { Pressable } from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { ButtonIcon, ButtonProps, ButtonSize, buttonToTextSizeMap } from './Button';
import { BUTTON_PRESS_ANIMATION_DURATION } from './useButtonPressAnimatedStyle';
import { HStack } from '../Stack';

export type TextButtonVariant = 'primary' | 'tertiary';

type TextButtonProps = Omit<ButtonProps, 'colorScheme'> & {
    isUnderlined?: boolean;
    variant?: TextButtonVariant;
};

const variantToColorsMap = {
    primary: {
        color: 'textPrimaryDefault',
        pressedColor: 'textPrimaryPressed',
    },
    tertiary: {
        color: 'textOnTertiary',
        pressedColor: 'textSubdued',
    },
} as const satisfies Record<TextButtonVariant, { color: Color; pressedColor: Color }>;

const buttonContainerStyle = prepareNativeStyle(() => ({
    alignItems: 'center',
}));

const textStyle = prepareNativeStyle(
    (utils, { buttonSize, isUnderlined }: { buttonSize: ButtonSize; isUnderlined: boolean }) => ({
        ...utils.typography[buttonToTextSizeMap[buttonSize]],
        extend: {
            condition: isUnderlined,
            style: {
                textDecorationLine: 'underline',
            },
        },
    }),
);

export const TextButton = ({
    iconLeft,
    iconRight,
    style,
    children,
    variant = 'primary',
    size = 'm',
    isDisabled = false,
    isUnderlined = false,
    ...pressableProps
}: TextButtonProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const textPressedColorValue = useSharedValue(0);

    const { color, pressedColor } = variantToColorsMap[variant];

    const animatedColor = useSharedValue(utils.colors[color]);

    const animatedTextStyle = useAnimatedStyle(
        () => ({
            color: isDisabled ? utils.colors.textDisabled : animatedColor.value,
        }),
        [isDisabled],
    );

    const interpolatePressColor = () => {
        animatedColor.value = interpolateColor(
            textPressedColorValue.value,
            [0, 1],
            [utils.colors[pressedColor], utils.colors[color]],
        ) as `rgba(${number}, ${number}, ${number}, ${number})`;
    };

    const handlePressIn = () => {
        textPressedColorValue.value = withTiming(1, { duration: BUTTON_PRESS_ANIMATION_DURATION });
        interpolatePressColor();
    };
    const handlePressOut = () => {
        textPressedColorValue.value = withTiming(0, { duration: BUTTON_PRESS_ANIMATION_DURATION });
        interpolatePressColor();
    };

    const iconName = iconLeft || iconRight;
    const icon = iconName ? (
        <ButtonIcon
            iconName={iconName}
            color={isDisabled ? 'iconDisabled' : animatedColor}
            buttonSize={size}
        />
    ) : null;

    return (
        <Pressable
            disabled={isDisabled}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={applyStyle(buttonContainerStyle)}
            {...pressableProps}
        >
            <HStack alignItems="center">
                {iconLeft && icon}
                <Animated.Text
                    style={[
                        applyStyle(textStyle, { buttonSize: size, isUnderlined }),
                        animatedTextStyle,
                    ]}
                >
                    {children}
                </Animated.Text>
                {iconRight && icon}
            </HStack>
        </Pressable>
    );
};
