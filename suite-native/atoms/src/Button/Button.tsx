import { type ReactNode, useState } from 'react';
import { type PressableProps } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { type AnimatedIconColor, Icon, type IconName } from '@suite-native/icons';
import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color, nativeSpacings } from '@trezor/theme';

import { Loader } from '../Loader';
import { AnimatedPressable } from '../Pressable';
import { HStack } from '../Stack';
import { Text } from '../Text';
import { type TestProps } from '../types';
import { type ButtonColorProps, type ButtonSize } from './types';
import { useButtonPressAnimatedStyle } from './useButtonPressAnimatedStyle';
import {
    buttonGapMap,
    buttonSizeToDimensionsMap,
    buttonToIconSizeMap,
    buttonToTextSizeMap,
    getButtonColors,
} from './utils';

export {
    BUTTON_INTENTS,
    BUTTON_PRIORITIES,
    BUTTON_SIZES,
    type ButtonColorProps,
    type ButtonIntent,
    type ButtonPriority,
    type ButtonSize,
} from './types';
export {
    buttonToIconSizeMap,
    buttonToTextSizeMap,
    getButtonColors,
    iconButtonToIconSizeMap,
} from './utils';

export type ButtonAccessory = IconName;

export type ButtonProps = Omit<PressableProps, 'style' | 'onPressIn' | 'onPressOut'> & {
    children: ReactNode;
    size?: ButtonSize;
    style?: NativeStyleObject;
    isDisabled?: boolean;
    isLoading?: boolean;
    flex?: number;
    isFullWidth?: boolean;
    iconLeft?: IconName;
    iconRight?: IconName;
} & ButtonColorProps &
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

export type ButtonStyleProps = {
    size: ButtonSize;
    backgroundColor: Color;
    isFullWidth: boolean;
    flex?: number;
};

export type ButtonTextStyleProps = {
    buttonSize: ButtonSize;
};

const LOADER_FADE_IN_DURATION = 500;

export const buttonStyle = prepareNativeStyle<ButtonStyleProps>(
    (utils, { size, backgroundColor, flex, isFullWidth }) => {
        const sizeDimensions = buttonSizeToDimensionsMap[size];

        return {
            flex,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: utils.colors[backgroundColor],
            ...sizeDimensions,
            extend: [
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

const buttonTextStyle = prepareNativeStyle<ButtonTextStyleProps>((utils, { buttonSize }) => ({
    ...utils.typography[buttonToTextSizeMap[buttonSize]],
    flexShrink: 1,
    paddingHorizontal: nativeSpacings.sp4,
}));

export const ButtonIcon = ({
    iconName,
    color = 'iconDefault',
    size = 'medium',
}: ButtonIconProps) => (
    <Icon.Animated name={iconName} color={color} size={buttonToIconSizeMap[size]} />
);

export const ButtonAccessoryView = ({
    element,
    iconColor = 'iconDefault',
    iconSize = 'medium',
}: ButtonAccessoryViewProps) => <ButtonIcon iconName={element} color={iconColor} size={iconSize} />;

export const Button = ({
    children,
    disabled: isNativeDisabled,
    flex,
    iconLeft,
    iconRight,
    intent = 'brand',
    isDisabled = false,
    isFullWidth = false,
    isInverse = false,
    isLoading = false,
    priority = 'primary',
    size = 'medium',
    style,
    testID,
    ...pressableProps
}: ButtonProps) => {
    const [isPressed, setIsPressed] = useState(false);
    const { applyStyle } = useNativeStyles();
    const hasDisabledState = isDisabled || !!isNativeDisabled;
    const hasDisabledVisualState = hasDisabledState || isLoading;
    const { backgroundColor, onPressColor, contentColor } = getButtonColors({
        intent,
        priority,
        isInverse,
        isDisabled: hasDisabledVisualState,
    });

    const animatedPressStyle = useButtonPressAnimatedStyle(
        isPressed,
        hasDisabledVisualState,
        backgroundColor,
        onPressColor,
    );

    const handlePressIn = () => setIsPressed(true);
    const handlePressOut = () => setIsPressed(false);

    return (
        <AnimatedPressable
            disabled={hasDisabledVisualState}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
                animatedPressStyle,
                applyStyle(buttonStyle, {
                    size,
                    backgroundColor,
                    flex,
                    isFullWidth,
                }),
                style,
            ]}
            testID={testID}
            {...pressableProps}
        >
            <HStack alignItems="center" justifyContent="center" spacing={buttonGapMap[size]}>
                {isLoading && (
                    <Animated.View
                        entering={FadeIn.duration(LOADER_FADE_IN_DURATION)}
                        testID={testID ? `${testID}/loading` : undefined}
                    >
                        <Loader color={contentColor} />
                    </Animated.View>
                )}
                {!isLoading && !!iconLeft && (
                    <ButtonAccessoryView
                        element={iconLeft}
                        iconColor={contentColor}
                        iconSize={size}
                    />
                )}
                <Text
                    color={contentColor}
                    numberOfLines={1}
                    style={applyStyle(buttonTextStyle, {
                        buttonSize: size,
                    })}
                    testID={testID ? `${testID}/text` : undefined}
                    textAlign="center"
                    variant={buttonToTextSizeMap[size]}
                >
                    {children}
                </Text>
                {!isLoading && !!iconRight && (
                    <ButtonAccessoryView
                        element={iconRight}
                        iconColor={contentColor}
                        iconSize={size}
                    />
                )}
            </HStack>
        </AnimatedPressable>
    );
};
