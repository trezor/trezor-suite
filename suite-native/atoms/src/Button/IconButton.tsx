import { useState } from 'react';
import { type PressableProps } from 'react-native';

import { Icon, type IconName } from '@suite-native/icons';
import {
    type NativeStyleObject,
    mergeNativeStyles,
    prepareNativeStyle,
    useNativeStyles,
} from '@trezor/styles-native';

import { type ButtonStyleProps, buttonStyle } from './Button';
import { type ButtonColorProps, type ButtonSize } from './types';
import { useButtonPressAnimatedStyle } from './useButtonPressAnimatedStyle';
import {
    getButtonColors,
    iconButtonBorderRadiusMap,
    iconButtonPaddingMap,
    iconButtonToIconSizeMap,
} from './utils';
import { Loader } from '../Loader';
import { AnimatedPressable } from '../Pressable';

export type IconButtonProps = Omit<
    PressableProps,
    'style' | 'onPressIn' | 'onPressOut' | 'children'
> & {
    iconName: IconName;
    size?: ButtonSize;
    style?: NativeStyleObject;
    isLoading?: boolean;
    isDisabled?: boolean;
} & ButtonColorProps;

const iconButtonStyle = mergeNativeStyles([
    buttonStyle,
    prepareNativeStyle<ButtonStyleProps>((_, { size }) => ({
        // Padding must be set explicitly to override the base button size styles.
        alignSelf: 'flex-start',
        paddingVertical: iconButtonPaddingMap[size],
        paddingHorizontal: iconButtonPaddingMap[size],
        borderRadius: iconButtonBorderRadiusMap[size],
    })),
]);

export const IconButton = ({
    iconName,
    testID,
    style,
    intent = 'brand',
    priority = 'primary',
    isInverse = false,
    size = 'medium',
    isLoading = false,
    isDisabled = false,
    ...pressableProps
}: IconButtonProps) => {
    const [isPressed, setIsPressed] = useState(false);
    const { applyStyle } = useNativeStyles();
    const hasDisabledState = isDisabled || isLoading;
    const { backgroundColor, onPressColor, contentColor } = getButtonColors({
        intent,
        priority,
        isInverse,
        isDisabled: hasDisabledState,
    });

    const animatedPressStyle = useButtonPressAnimatedStyle(
        isPressed,
        hasDisabledState,
        backgroundColor,
        onPressColor,
    );

    const handlePressIn = () => setIsPressed(true);
    const handlePressOut = () => setIsPressed(false);

    return (
        <AnimatedPressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={hasDisabledState}
            style={[
                animatedPressStyle,
                applyStyle(iconButtonStyle, {
                    size,
                    isFullWidth: false,
                    backgroundColor,
                }),
                style,
            ]}
            testID={testID}
            {...pressableProps}
        >
            {isLoading ? (
                <Loader color={contentColor} />
            ) : (
                <Icon name={iconName} color={contentColor} size={iconButtonToIconSizeMap[size]} />
            )}
        </AnimatedPressable>
    );
};
