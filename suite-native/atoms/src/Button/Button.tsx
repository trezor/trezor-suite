import { type ReactNode } from 'react';
import { Platform, type PressableProps, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { type AnimatedIconColor, Icon, type IconName } from '@suite-native/icons';
import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color, nativeSpacings } from '@trezor/theme';

import { Loader } from '../Loader';
import { HStack } from '../Stack';
import { Text } from '../Text';
import { type TestProps } from '../types';
import { LegacyButtonPressable } from './LegacyButtonPressable';
import { NativeButton, supportsNativeButton } from './NativeButton';
import { hasUnsupportedNativeButtonProps } from './hasUnsupportedNativeButtonProps';
import { type ButtonColorProps, type ButtonSize } from './types';
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

export type ButtonProps = Omit<PressableProps, 'style' | 'onPress' | 'onPressIn' | 'onPressOut'> & {
    children: ReactNode;
    onPress?: () => void;
    size?: ButtonSize;
    style?: NativeStyleObject;
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
    usesSystemFont?: boolean;
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

const buttonTextStyle = prepareNativeStyle<ButtonTextStyleProps>(
    (utils, { buttonSize, usesSystemFont }) => ({
        ...utils.typography[buttonToTextSizeMap[buttonSize]],
        flexShrink: 1,
        paddingHorizontal: nativeSpacings.sp4,
        extend: [
            {
                condition: !!usesSystemFont,
                style: {
                    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
                    fontWeight: '600',
                },
            },
        ],
    }),
);

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
}: ButtonAccessoryViewProps) => (
    <View
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
    >
        <ButtonIcon iconName={element} color={iconColor} size={iconSize} />
    </View>
);

export const Button = ({
    children,
    accessibilityState,
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
    size = 'large',
    style,
    testID,
    shouldWrapChildrenInText = true,
    ...pressableProps
}: ButtonProps) => {
    const { applyStyle } = useNativeStyles();
    const hasDisabledState = isDisabled || !!isNativeDisabled;
    const hasDisabledVisualState = hasDisabledState || isLoading;
    const { backgroundColor, onPressColor, contentColor } = getButtonColors({
        intent,
        priority,
        isInverse,
        isDisabled: hasDisabledVisualState,
    });

    const hasCustomGestures = hasUnsupportedNativeButtonProps(pressableProps);

    const usesNativeButton = supportsNativeButton && !hasCustomGestures;

    const content = (
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
                <ButtonAccessoryView element={iconLeft} iconColor={contentColor} iconSize={size} />
            )}

            {shouldWrapChildrenInText ? (
                <Text
                    color={contentColor}
                    numberOfLines={1}
                    style={applyStyle(buttonTextStyle, {
                        buttonSize: size,
                        usesSystemFont: usesNativeButton,
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
                <ButtonAccessoryView element={iconRight} iconColor={contentColor} iconSize={size} />
            )}
        </HStack>
    );

    if (usesNativeButton) {
        return (
            <NativeButton
                {...pressableProps}
                accessibilityLabel={
                    pressableProps.accessibilityLabel ??
                    (typeof children === 'string' ? children : undefined)
                }
                accessibilityState={accessibilityState}
                intent={intent}
                priority={priority}
                isInverse={isInverse}
                size={size}
                isDisabled={hasDisabledVisualState}
                isLoading={isLoading}
                isFullWidth={isFullWidth}
                flex={flex}
                style={style}
                testID={testID}
            >
                {content}
            </NativeButton>
        );
    }

    return (
        <LegacyButtonPressable
            accessibilityRole="button"
            accessibilityState={{
                ...accessibilityState,
                disabled: hasDisabledVisualState,
                busy: isLoading,
            }}
            isDisabled={hasDisabledVisualState}
            backgroundColor={backgroundColor}
            onPressColor={onPressColor}
            style={[
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
            {content}
        </LegacyButtonPressable>
    );
};
