import { type FlexStyle, Pressable } from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import { type Color } from '@trezor/theme';

import { HStack } from '../Stack';
import { pressTimingConfig } from '../constants';
import {
    ButtonAccessoryView,
    type ButtonProps,
    type ButtonSize,
    buttonToTextSizeMap,
} from './Button';

export const TEXT_BUTTON_VARIANTS = ['primary', 'tertiary', 'blue'] as const;
export type TextButtonVariant = (typeof TEXT_BUTTON_VARIANTS)[number];

export type TextButtonProps = Omit<ButtonProps, 'colorScheme'> & {
    isUnderlined?: boolean;
    variant?: TextButtonVariant;
    isBold?: boolean;
    justifyContent?: FlexStyle['justifyContent'];
    testID?: string;
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
    blue: {
        color: 'textAlertBlue',
        pressedColor: 'textAlertBlue',
    },
} as const satisfies Record<TextButtonVariant, { color: Color; pressedColor: Color }>;

const buttonContainerStyle = prepareNativeStyle(() => ({
    alignItems: 'center',
}));

const textStyle = prepareNativeStyle(
    (
        utils,
        {
            buttonSize,
            isUnderlined,
            isBold,
        }: { buttonSize: ButtonSize; isUnderlined: boolean; isBold: boolean },
    ) => ({
        ...utils.typography[buttonToTextSizeMap[buttonSize]],
        flexShrink: 1,
        extend: [
            {
                condition: isUnderlined,
                style: {
                    textDecorationLine: 'underline',
                },
            },
            {
                condition: isBold,
                style: {
                    fontWeight: utils.fontWeights.bold,
                },
            },
        ],
    }),
);

export const TextButton = ({
    viewLeft,
    viewRight,
    style,
    children,
    variant = 'primary',
    size = 'medium',
    isDisabled = false,
    isUnderlined = false,
    isBold = false,
    justifyContent,
    testID,
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
        // eslint-disable-next-line react-hooks/immutability
        animatedColor.value = interpolateColor(
            textPressedColorValue.value,
            [0, 1],
            [utils.colors[pressedColor], utils.colors[color]],
        ) as `rgba(${number}, ${number}, ${number}, ${number})`;
    };

    const handlePressIn = () => {
        textPressedColorValue.value = withTiming(1, pressTimingConfig);
        interpolatePressColor();
    };
    const handlePressOut = () => {
        textPressedColorValue.value = withTiming(0, pressTimingConfig);
        interpolatePressColor();
    };

    const iconColor = isDisabled ? 'iconDisabled' : animatedColor;

    return (
        <Pressable
            disabled={isDisabled}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={applyStyle(buttonContainerStyle)}
            testID={`${testID}/button`}
            {...pressableProps}
        >
            <HStack alignItems="center" justifyContent={justifyContent}>
                {viewLeft && (
                    <ButtonAccessoryView element={viewLeft} iconColor={iconColor} iconSize={size} />
                )}
                <Animated.Text
                    testID={`${testID}/text`}
                    numberOfLines={1}
                    style={[
                        applyStyle(textStyle, { buttonSize: size, isUnderlined, isBold }),
                        animatedTextStyle,
                    ]}
                >
                    {children}
                </Animated.Text>
                {viewRight && (
                    <ButtonAccessoryView
                        element={viewRight}
                        iconColor={iconColor}
                        iconSize={size}
                    />
                )}
            </HStack>
        </Pressable>
    );
};
