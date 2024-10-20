import { useState } from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { IconName, Icon } from '@suite-native/icons';
import {
    mergeNativeStyles,
    NativeStyleObject,
    prepareNativeStyle,
    useNativeStyles,
} from '@trezor/styles';

import {
    ButtonColorScheme,
    buttonSchemeToColorsMap,
    ButtonSize,
    buttonStyle,
    ButtonStyleProps,
    buttonToIconSizeMap,
} from './Button';
import { useButtonPressAnimatedStyle } from './useButtonPressAnimatedStyle';
type IconButtonProps = Omit<PressableProps, 'style' | 'onPressIn' | 'onPressOut'> & {
    iconName: IconName;
    colorScheme?: ButtonColorScheme;
    size?: ButtonSize;
    style?: NativeStyleObject;
    isDisabled?: boolean;
};
const sizeDimensions = {
    extraSmall: 36,
    small: 40,
    medium: 48,
    large: 56,
} as const satisfies Record<ButtonSize, number>;

const iconButtonStyle = mergeNativeStyles([
    buttonStyle,
    prepareNativeStyle<ButtonStyleProps>((_, { size, hasTitle }) => {
        return {
            height: sizeDimensions[size],
            width: hasTitle ? 'auto' : sizeDimensions[size],
            // padding must be set using paddingVertical and paddingHorizontal otverwise it won't override the default padding
            paddingVertical: 0,
            paddingHorizontal: 0,
        };
    }),
]);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const IconButton = ({
    iconName,
    style,
    colorScheme = 'primary',
    size = 'medium',
    isDisabled = false,
    ...pressableProps
}: IconButtonProps) => {
    const [isPressed, setIsPressed] = useState(false);
    const { applyStyle } = useNativeStyles();
    const { disabledColors, ...baseColors } = buttonSchemeToColorsMap[colorScheme];
    const { backgroundColor, onPressColor, iconColor } = isDisabled ? disabledColors : baseColors;

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
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isDisabled}
            {...pressableProps}
            style={[
                animatedPressStyle,
                applyStyle(iconButtonStyle, {
                    size,
                    backgroundColor,
                    isDisabled,
                }),
                style,
            ]}
        >
            <Icon name={iconName} color={iconColor} size={buttonToIconSizeMap[size]} />
        </AnimatedPressable>
    );
};
