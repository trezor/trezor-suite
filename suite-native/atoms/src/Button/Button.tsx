import { type ReactNode, useState } from 'react';
import { type PressableProps } from 'react-native';
import { FadeIn } from 'react-native-reanimated';

import { type AnimatedIconColor, Icon, type IconName } from '@suite-native/icons';
import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color, nativeSpacings } from '@trezor/theme';

import { AnimatedPressable } from '../Animated/AnimatedPressable';
import { AnimatedHStack } from '../Animated/AnimatedStack';
import { AnimatedView } from '../Animated/AnimatedView';
import { Loader } from '../Loader';
import { Text } from '../Text';
import { type TestProps } from '../types';
import { type ButtonColorProps, type ButtonSize } from './types';
import { useButtonPressAnimatedStyles } from './useButtonPressAnimatedStyles';
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
    isFloating?: boolean;
    isDisabled?: boolean;
    isLoading?: boolean;
    flex?: number;
    isFullWidth?: boolean;
    iconLeft?: IconName;
    iconRight?: IconName;
    shouldWrapChildrenInText?: boolean;
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

const buttonPressableStyle = prepareNativeStyle<ButtonStyleProps>(
    ({ colors }, { size, backgroundColor, flex, isFullWidth }) => ({
        flex,
        width: isFullWidth ? '100%' : 'auto',
        borderRadius: buttonSizeToDimensionsMap[size].borderRadius,
        backgroundColor: colors[backgroundColor],
    }),
);

export const buttonStyle = prepareNativeStyle<ButtonStyleProps>(
    ({ colors }, { size, backgroundColor, flex, isFullWidth }) => ({
        flex,
        width: isFullWidth ? '100%' : 'auto',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors[backgroundColor],
        ...buttonSizeToDimensionsMap[size],
    }),
);

const buttonTextStyle = prepareNativeStyle<ButtonTextStyleProps>((utils, { buttonSize }) => ({
    ...utils.typography[buttonToTextSizeMap[buttonSize]],
    flexShrink: 1,
    paddingHorizontal: nativeSpacings.sp4,
}));

export const ButtonIcon = ({
    iconName,
    color = 'contentPrimary',
    size = 'large',
}: ButtonIconProps) => (
    <Icon.Animated name={iconName} color={color} size={buttonToIconSizeMap[size]} />
);

export const ButtonAccessoryView = ({
    element,
    iconColor = 'contentPrimary',
    iconSize = 'medium',
}: ButtonAccessoryViewProps) => <ButtonIcon iconName={element} color={iconColor} size={iconSize} />;

export const Button = ({
    children,
    disabled: isNativeDisabled,
    flex,
    iconLeft,
    iconRight,
    intent = 'brand',
    isFloating = false,
    isDisabled = false,
    isFullWidth = false,
    isInverse = false,
    isLoading = false,
    priority = 'primary',
    size = 'large',
    style,
    testID,
    shouldWrapChildrenInText = true,
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

    const [buttonPressStyle, buttonColorStyle] = useButtonPressAnimatedStyles(
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
                buttonPressStyle,
                applyStyle(buttonPressableStyle, {
                    size,
                    backgroundColor: isFloating ? 'surfaceFillRaised' : 'transparent',
                    flex,
                    isFullWidth,
                }),
            ]}
            testID={testID}
            {...pressableProps}
        >
            <AnimatedHStack
                alignItems="center"
                justifyContent="center"
                spacing={buttonGapMap[size]}
                style={[
                    buttonColorStyle,
                    applyStyle(buttonStyle, {
                        size,
                        backgroundColor,
                        isFullWidth,
                    }),
                    style,
                ]}
            >
                {isLoading && (
                    <AnimatedView
                        entering={FadeIn.duration(LOADER_FADE_IN_DURATION)}
                        testID={testID ? `${testID}/loading` : undefined}
                    >
                        <Loader color={contentColor} />
                    </AnimatedView>
                )}
                {!isLoading && !!iconLeft && (
                    <ButtonAccessoryView
                        element={iconLeft}
                        iconColor={contentColor}
                        iconSize={size}
                    />
                )}

                {shouldWrapChildrenInText ? (
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
                ) : (
                    children
                )}
                {!isLoading && !!iconRight && (
                    <ButtonAccessoryView
                        element={iconRight}
                        iconColor={contentColor}
                        iconSize={size}
                    />
                )}
            </AnimatedHStack>
        </AnimatedPressable>
    );
};
