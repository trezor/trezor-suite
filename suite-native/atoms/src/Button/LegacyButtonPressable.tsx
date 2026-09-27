import { type ReactNode, useState } from 'react';
import { type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { type Color } from '@trezor/theme';

import { AnimatedPressable } from '../Pressable';
import { useButtonPressAnimatedStyle } from './useButtonPressAnimatedStyle';

type LegacyButtonPressableProps = Omit<PressableProps, 'children' | 'style'> & {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    isDisabled: boolean;
    backgroundColor: Color;
    onPressColor: Color;
};

export const LegacyButtonPressable = ({
    children,
    style,
    isDisabled,
    backgroundColor,
    onPressColor,
    ...pressableProps
}: LegacyButtonPressableProps) => {
    const [isPressed, setIsPressed] = useState(false);
    const animatedPressStyle = useButtonPressAnimatedStyle(
        isPressed,
        isDisabled,
        backgroundColor,
        onPressColor,
    );

    return (
        <AnimatedPressable
            {...pressableProps}
            disabled={isDisabled}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            style={[animatedPressStyle, style]}
        >
            {children}
        </AnimatedPressable>
    );
};
