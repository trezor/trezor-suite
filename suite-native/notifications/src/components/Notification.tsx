import { type ReactNode, useEffect } from 'react';
import { TouchableWithoutFeedback } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    type EntryAnimationsValues,
    SlideInUp,
    SlideOutUp,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { Box, HStack, Text } from '@suite-native/atoms';
import { InvertedThemeProvider } from '@suite-native/theme';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type NotificationProps = {
    iconLeft?: ReactNode;
    iconRight?: ReactNode;
    title: string;
    description: ReactNode;
    onPress: () => void;
    onHide: () => void;
    isHiddenAutomatically?: boolean;
};

const DISMISS_THRESHOLD = -25;
const HIDDEN_OFFSET = -200;

const ENTER_ANIMATION_DURATION = 1000;
const EXIT_ANIMATION_DURATION = 500;
const NOTIFICATION_VISIBLE_DURATION = 5000 + ENTER_ANIMATION_DURATION + EXIT_ANIMATION_DURATION;

const notificationContainerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: utils.spacings.sp4,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.backgroundNeutralBold,
    paddingHorizontal: utils.spacings.sp4,
    ...utils.boxShadows.small,
}));

const notificationContentStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
}));

const notificationTextsStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
}));

export const Notification = ({
    iconLeft,
    iconRight,
    title,
    description,
    onPress,
    onHide,
    isHiddenAutomatically = true,
}: NotificationProps) => {
    const { applyStyle } = useNativeStyles();

    const translateY = useSharedValue(0);

    const onSwipeGesture = Gesture.Pan()
        .onUpdate(event => {
            if (event.translationY <= 0) translateY.value = event.translationY;
        })
        .onEnd(event => {
            if (event.translationY < DISMISS_THRESHOLD) {
                translateY.value = withTiming(HIDDEN_OFFSET, undefined, isFinished => {
                    if (isFinished) runOnJS(onHide)();
                });
            } else {
                translateY.value = withTiming(0);
            }
        });

    useEffect(() => {
        const timeout = setTimeout(
            () => isHiddenAutomatically && onHide(),
            NOTIFICATION_VISIBLE_DURATION,
        );

        return () => clearTimeout(timeout);
    }, [isHiddenAutomatically, onHide]);

    const swipeGestureStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: translateY.value,
            },
        ],
    }));

    return (
        <Box>
            <InvertedThemeProvider>
                <GestureDetector gesture={onSwipeGesture}>
                    <Animated.View
                        style={swipeGestureStyle}
                        entering={SlideInUp.duration(ENTER_ANIMATION_DURATION)}
                        exiting={SlideOutUp.duration(EXIT_ANIMATION_DURATION)}
                    >
                        <TouchableWithoutFeedback onPress={onPress}>
                            <HStack spacing="sp32" style={applyStyle(notificationContainerStyle)}>
                                <HStack
                                    spacing="sp12"
                                    flexDirection="row"
                                    style={applyStyle(notificationContentStyle)}
                                >
                                    {iconLeft}
                                    <Box style={applyStyle(notificationTextsStyle)}>
                                        <Text>{title}</Text>
                                        {description}
                                    </Box>
                                </HStack>
                                <Box marginHorizontal="sp8">{iconRight}</Box>
                            </HStack>
                        </TouchableWithoutFeedback>
                    </Animated.View>
                </GestureDetector>
            </InvertedThemeProvider>
        </Box>
    );
};
