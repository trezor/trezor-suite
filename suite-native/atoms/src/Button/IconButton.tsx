import { useState } from 'react';
import { type PressableProps } from 'react-native';

import { Icon, type IconName } from '@suite-native/icons';
import {
    type NativeStyleObject,
    mergeNativeStyles,
    prepareNativeStyle,
    useNativeStyles,
} from '@trezor/styles';

import {
    type ButtonColorScheme,
    type ButtonSize,
    type ButtonStyleProps,
    buttonSchemeToColorsMap,
    buttonStyle,
    buttonToIconSizeMap,
} from './Button';
import { useButtonPressAnimatedStyle } from './useButtonPressAnimatedStyle';
import { Loader } from '../Loader';
import { AnimatedPressable } from '../Pressable';

export type IconButtonProps = Omit<
    PressableProps,
    'style' | 'onPressIn' | 'onPressOut' | 'children'
> & {
    iconName: IconName;
    colorScheme?: ButtonColorScheme;
    size?: ButtonSize;
    style?: NativeStyleObject;
    isLoading?: boolean;
    isDisabled?: boolean;
};

const sizeDimensions = {
    tiny: 20,
    extraSmall: 36,
    small: 40,
    medium: 48,
    large: 56,
} as const satisfies Record<ButtonSize, number>;

const iconButtonStyle = mergeNativeStyles([
    buttonStyle,
    prepareNativeStyle<ButtonStyleProps>((_, { size }) => ({
        height: sizeDimensions[size],
        width: sizeDimensions[size],
        // padding must be set using paddingVertical and paddingHorizontal otverwise it won't override the default padding
        paddingVertical: 0,
        paddingHorizontal: 0,
    })),
]);

export const IconButton = ({
    iconName,
    style,
    colorScheme = 'primary',
    size = 'medium',
    isLoading = false,
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
            disabled={isDisabled || isLoading}
            {...pressableProps}
            style={[
                animatedPressStyle,
                applyStyle(iconButtonStyle, {
                    size,
                    isFullWidth: false,
                    backgroundColor,
                    isDisabled,
                }),
                style,
            ]}
        >
            {isLoading ? (
                <Loader color={iconColor} />
            ) : (
                <Icon name={iconName} color={iconColor} size={buttonToIconSizeMap[size]} />
            )}
        </AnimatedPressable>
    );
};
