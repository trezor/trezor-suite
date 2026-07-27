import { type ReactNode, useCallback, useEffect } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, {
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { Icon, type IconName } from '@suite-native/icons';
import { type NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { Loader } from '../Loader';
import { HStack } from '../Stack';
import { pressTimingConfig } from '../constants';
import { type TestProps } from '../types';
import { type ButtonColorProps, TEXT_BUTTON_SIZES, type TextButtonSize } from './types';
import {
    getTextButtonColor,
    getTextButtonDisabledColor,
    textButtonGapMap,
    textButtonIconSizeMap,
    textButtonTypographyMap,
} from './utils';

export { TEXT_BUTTON_SIZES };

export type TextButtonProps = Omit<
    PressableProps,
    'children' | 'onPressIn' | 'onPressOut' | 'style'
> & {
    children?: ReactNode;
    iconLeft?: IconName;
    iconRight?: IconName;
    size?: TextButtonSize;
    style?: NativeStyleObject;
    isLoading?: boolean;
    isDisabled?: boolean;
    isUnderlined?: boolean;
} & ButtonColorProps &
    TestProps;

type TextButtonStyleProps = {
    isUnderlined: boolean;
    size: TextButtonSize;
};

const buttonContainerStyle = prepareNativeStyle(() => ({
    alignSelf: 'center',
    maxWidth: '100%',
}));

const textStyle = prepareNativeStyle<TextButtonStyleProps>((utils, { isUnderlined, size }) => ({
    ...utils.typography[textButtonTypographyMap[size]],
    flexShrink: 1,
    extend: [
        {
            condition: isUnderlined,
            style: {
                textDecorationLine: 'underline',
            },
        },
    ],
}));

export const TextButton = ({
    children,
    disabled: isNativeDisabled,
    iconLeft,
    iconRight,
    intent = 'neutral',
    isDisabled = false,
    isInverse = false,
    isLoading = false,
    isUnderlined = false,
    priority = 'primary',
    size = 'large',
    style,
    testID,
    ...pressableProps
}: TextButtonProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const hasDisabledVisualState = isDisabled || !!isNativeDisabled || isLoading;
    const disabledColor = getTextButtonDisabledColor(isInverse);
    const defaultTextColor = getTextButtonColor({
        intent,
        priority,
        isInverse,
        isPressed: false,
    });
    const pressedTextColor = getTextButtonColor({
        intent,
        priority,
        isInverse,
        isPressed: true,
    });
    const animatedColor = useSharedValue(
        utils.colors[hasDisabledVisualState ? disabledColor : defaultTextColor],
    );

    const animatedTextStyle = useAnimatedStyle(() => ({
        color: animatedColor.value,
    }));

    const setAnimatedColor = useCallback(
        (color: Color) => {
            // eslint-disable-next-line react-hooks/immutability
            animatedColor.value = withTiming(utils.colors[color], pressTimingConfig);
        },
        [animatedColor, utils.colors],
    );

    useEffect(() => {
        setAnimatedColor(hasDisabledVisualState ? disabledColor : defaultTextColor);
    }, [defaultTextColor, disabledColor, hasDisabledVisualState, setAnimatedColor]);

    useEffect(() => () => cancelAnimation(animatedColor), [animatedColor]);

    const handlePressIn = () => {
        setAnimatedColor(pressedTextColor);
    };

    const handlePressOut = () => {
        setAnimatedColor(defaultTextColor);
    };

    return (
        <Pressable
            disabled={hasDisabledVisualState}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[applyStyle(buttonContainerStyle), style]}
            testID={testID ? `${testID}/button` : undefined}
            {...pressableProps}
        >
            <HStack alignItems="center" justifyContent="center" spacing={textButtonGapMap[size]}>
                {isLoading && (
                    <Animated.View testID={testID ? `${testID}/loading` : undefined}>
                        <Loader color={disabledColor} size={textButtonIconSizeMap[size]} />
                    </Animated.View>
                )}
                {!isLoading && !!iconLeft && (
                    <Icon.Animated
                        name={iconLeft}
                        color={animatedColor}
                        size={textButtonIconSizeMap[size]}
                    />
                )}
                <Animated.Text
                    numberOfLines={1}
                    style={[applyStyle(textStyle, { isUnderlined, size }), animatedTextStyle]}
                    testID={testID ? `${testID}/text` : undefined}
                >
                    {children}
                </Animated.Text>
                {!isLoading && !!iconRight && (
                    <Icon.Animated
                        name={iconRight}
                        color={animatedColor}
                        size={textButtonIconSizeMap[size]}
                    />
                )}
            </HStack>
        </Pressable>
    );
};
