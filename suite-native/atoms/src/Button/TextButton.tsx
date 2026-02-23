import { FlexStyle, Pressable } from 'react-native';
import Animated, {
    FadeIn,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Loader } from '../Loader';
import { HStack } from '../Stack';
import { pressTimingConfig } from '../constants';
import {
    ButtonAccessory,
    ButtonAccessoryView,
    ButtonProps,
    buttonToTextSizeMap,
} from './Button';

export const TEXT_BUTTON_INTENTS = [
    'neutralPrimary',
    'neutralSecondary',
    'brand',
    'info',
    'warning',
    'critical',
    'accentViolet',
] as const;
export type TextButtonIntent = (typeof TEXT_BUTTON_INTENTS)[number];

export const TEXT_BUTTON_SIZES = ['small', 'medium'] as const;
export type TextButtonSize = (typeof TEXT_BUTTON_SIZES)[number];

export type TextButtonProps = Omit<
    ButtonProps,
    'colorScheme' | 'size' | 'viewLeft' | 'viewRight'
> & {
    iconLeft?: ButtonAccessory;
    iconRight?: ButtonAccessory;
    isUnderlined?: boolean;
    intent?: TextButtonIntent;
    size?: TextButtonSize;
    justifyContent?: FlexStyle['justifyContent'];
    testID?: string;
};

const intentToColorsMap = {
    neutralPrimary: {
        color: 'textDefault',
        pressedColor: 'textSubdued',
    },
    neutralSecondary: {
        color: 'textSubdued',
        pressedColor: 'textOnTertiary',
    },
    brand: {
        color: 'textPrimaryDefault',
        pressedColor: 'textPrimaryPressed',
    },
    info: {
        color: 'textAlertBlue',
        pressedColor: 'textAlertBlue',
    },
    warning: {
        color: 'textAlertYellow',
        pressedColor: 'textAlertYellow',
    },
    critical: {
        color: 'textAlertRed',
        pressedColor: 'textAlertRed',
    },
    accentViolet: {
        color: 'textAlertPurple',
        pressedColor: 'textAlertPurple',
    },
} as const satisfies Record<TextButtonIntent, { color: Color; pressedColor: Color }>;

const LOADER_FADE_IN_DURATION = 500;

const buttonContainerStyle = prepareNativeStyle(() => ({
    alignItems: 'center',
}));

const textStyle = prepareNativeStyle(
    (
        utils,
        {
            buttonSize,
            isUnderlined,
        }: { buttonSize: TextButtonSize; isUnderlined: boolean },
    ) => ({
        ...utils.typography[buttonToTextSizeMap[buttonSize]],
        extend: [
            {
                condition: isUnderlined,
                style: {
                    textDecorationLine: 'underline',
                },
            },
        ],
    }),
);

export const TextButton = ({
    iconLeft,
    iconRight,
    style,
    children,
    intent = 'neutralPrimary',
    size = 'medium',
    isDisabled = false,
    isLoading = false,
    isUnderlined = false,
    justifyContent,
    testID,
    ...pressableProps
}: TextButtonProps) => {
    const { applyStyle, utils } = useNativeStyles();
    const textPressedColorValue = useSharedValue(0);

    const { color, pressedColor } = intentToColorsMap[intent];

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
            disabled={isDisabled || isLoading}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={applyStyle(buttonContainerStyle)}
            testID={`${testID}/button`}
            {...pressableProps}
        >
            {isLoading ? (
                <Animated.View
                    testID={`${testID}/loading`}
                    entering={FadeIn.duration(LOADER_FADE_IN_DURATION)}
                >
                    <Loader color={color} />
                </Animated.View>
            ) : (
                <HStack alignItems="center" justifyContent={justifyContent}>
                    {iconLeft && (
                        <ButtonAccessoryView
                            element={iconLeft}
                            iconColor={iconColor}
                            iconSize={size}
                        />
                    )}
                    <Animated.Text
                        testID={`${testID}/text`}
                        style={[
                            applyStyle(textStyle, { buttonSize: size, isUnderlined }),
                            animatedTextStyle,
                        ]}
                    >
                        {children}
                    </Animated.Text>
                    {iconRight && (
                        <ButtonAccessoryView
                            element={iconRight}
                            iconColor={iconColor}
                            iconSize={size}
                        />
                    )}
                </HStack>
            )}
        </Pressable>
    );
};
