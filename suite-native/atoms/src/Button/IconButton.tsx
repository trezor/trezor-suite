import { ReactNode, useState } from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { IconName } from '@suite-common/icons-deprecated';
import {
    NativeStyleObject,
    prepareNativeStyle,
    mergeNativeStyles,
    useNativeStyles,
} from '@trezor/styles';

import {
    ButtonColorScheme,
    ButtonSize,
    buttonSchemeToColorsMap,
    buttonStyle,
    ButtonStyleProps,
    ButtonIcon,
} from './Button';
import { Box } from '../Box';
import { Text } from '../Text';
import { useButtonPressAnimatedStyle } from './useButtonPressAnimatedStyle';

type IconButtonProps = Omit<PressableProps, 'style' | 'onPressIn' | 'onPressOut'> & {
    iconName: IconName;
    colorScheme?: ButtonColorScheme;
    size?: ButtonSize;
    style?: NativeStyleObject;
    title?: ReactNode;
    isDisabled?: boolean;
};

const iconButtonStyle = mergeNativeStyles([
    buttonStyle,
    prepareNativeStyle<ButtonStyleProps>((_, { size, hasTitle }) => {
        const sizeDimensions = {
            extraSmall: 36,
            small: 40,
            medium: 48,
            large: 56,
        } as const satisfies Record<ButtonSize, number>;

        return {
            padding: 0,
            height: sizeDimensions[size],
            width: hasTitle ? 'auto' : sizeDimensions[size],
        };
    }),
]);

export const IconButton = ({
    iconName,
    style,
    title,
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
        <Box alignItems="center" style={style}>
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isDisabled}
                {...pressableProps}
            >
                <Box alignItems="center">
                    <Animated.View
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
                        <ButtonIcon iconName={iconName} color={iconColor} size={size} />
                    </Animated.View>
                    {title && (
                        <Text variant="label" color="textSubdued">
                            {title}
                        </Text>
                    )}
                </Box>
            </Pressable>
        </Box>
    );
};
