import { type GestureResponderEvent, Pressable, type TextProps } from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import type { RequireAtLeastOne } from 'type-fest';

import { HStack } from '@suite-native/atoms';
import { type CSSColor, Icon, type IconName } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';
import type { Color, TypographyStyle } from '@trezor/theme';

import { useOpenLink } from '../useOpenLink';

type LinkProps = RequireAtLeastOne<
    {
        label: React.ReactNode;
        href?: string;
        onPress?: () => void;
        isUnderlined?: boolean;
        showExternalIcon?: boolean;
        externalIconName?: IconName;
        textColor?: Color;
        textPressedColor?: Color;
        textVariant?: TypographyStyle;
        style?: TextProps['style'];
    },
    'href' | 'onPress'
> &
    Omit<
        TextProps,
        'onPress' | 'onPressIn' | 'onPressOut' | 'style' | 'suppressHighlighting' | 'children'
    >;

const textStyle = prepareNativeStyle<{ isUnderlined: boolean; textVariant: TypographyStyle }>(
    (utils, { isUnderlined, textVariant }) => ({
        ...utils.typography[textVariant],
        extend: {
            condition: isUnderlined,
            style: {
                textDecorationLine: 'underline',
            },
        },
    }),
);

const ANIMATION_DURATION = 100;
const IS_NOT_PRESSED_VALUE = 0;
const IS_PRESSED_VALUE = 1;

export const Link = ({
    href,
    label,
    isUnderlined = false,
    showExternalIcon = false,
    externalIconName = 'arrowLineUpRight',
    textColor = 'contentBrand',
    textPressedColor = 'contentBrandPressed',
    textVariant = 'body-md',
    onPress,
    style,
    ...textProps
}: LinkProps) => {
    const { utils, applyStyle } = useNativeStyles();
    const openLink = useOpenLink();
    const isPressed = useSharedValue(IS_NOT_PRESSED_VALUE);

    const animatedColor = useDerivedValue<CSSColor>(
        () =>
            interpolateColor(
                isPressed.value,
                [IS_NOT_PRESSED_VALUE, IS_PRESSED_VALUE],
                [utils.colors[textColor], utils.colors[textPressedColor]],
            ) as CSSColor,
    );

    const animatedTextColorStyle = useAnimatedStyle(() => ({ color: animatedColor.value }));

    const handlePressIn = (e: GestureResponderEvent) => {
        // eslint-disable-next-line react-hooks/immutability
        isPressed.value = withTiming(IS_PRESSED_VALUE, { duration: ANIMATION_DURATION });
        e.stopPropagation();
    };

    const handlePressOut = (e: GestureResponderEvent) => {
        // eslint-disable-next-line react-hooks/immutability
        isPressed.value = withTiming(IS_NOT_PRESSED_VALUE, { duration: ANIMATION_DURATION });
        if (href) openLink(href);

        onPress?.();
        e.stopPropagation();
    };

    return (
        <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <HStack spacing="sp6" alignItems="center">
                <Animated.Text
                    {...textProps}
                    suppressHighlighting
                    style={[
                        applyStyle(textStyle, { isUnderlined, textVariant }),
                        animatedTextColorStyle,
                        style,
                    ]}
                >
                    {label}
                </Animated.Text>
                {showExternalIcon && (
                    <Icon.Animated name={externalIconName} color={animatedColor} size="medium" />
                )}
            </HStack>
        </Pressable>
    );
};
