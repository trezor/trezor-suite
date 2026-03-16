import { type GestureResponderEvent, type TextProps } from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import type { RequireAtLeastOne } from 'type-fest';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import type { Color, TypographyStyle } from '@trezor/theme';

import { useOpenLink } from '../useOpenLink';

type LinkProps = RequireAtLeastOne<
    {
        label: React.ReactNode;
        href?: string;
        onPress?: () => void;
        isUnderlined?: boolean;
        textColor?: Color;
        textPressedColor?: Color;
        textVariant?: TypographyStyle;
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

const noop = () => {};

export const Link = ({
    href,
    label,
    isUnderlined = false,
    textColor = 'textPrimaryDefault',
    textPressedColor = 'textPrimaryPressed',
    textVariant = 'body-md',
    onPress,
    ...textProps
}: LinkProps) => {
    const { utils, applyStyle } = useNativeStyles();
    const openLink = useOpenLink();
    const isPressed = useSharedValue(IS_NOT_PRESSED_VALUE);

    const animatedTextColorStyle = useAnimatedStyle(() => ({
        color: interpolateColor(
            isPressed.value,
            [IS_NOT_PRESSED_VALUE, IS_PRESSED_VALUE],
            [utils.colors[textColor], utils.colors[textPressedColor]],
        ),
    }));

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
        <Animated.Text
            {...textProps}
            onPressIn={handlePressIn}
            onPress={noop} // If the handling is defined in onPress, the very short taps are sometimes ignored
            onPressOut={handlePressOut}
            style={[applyStyle(textStyle, { isUnderlined, textVariant }), animatedTextColorStyle]}
            suppressHighlighting
        >
            {label}
        </Animated.Text>
    );
};
