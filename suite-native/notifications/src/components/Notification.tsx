import React, { ReactNode, useState, useEffect } from 'react';
import Animated, {
    SlideInUp,
    SlideOutUp,
    useAnimatedGestureHandler,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import { TouchableWithoutFeedback } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { InvertedThemeProvider } from '@suite-native/theme';

type NotificationProps = {
    iconLeft?: ReactNode;
    iconRight?: ReactNode;
    title: string;
    description: ReactNode;
    onPress: () => void;
    isHiddenAutomatically?: boolean;
};

const DISMISS_THRESHOLD = -25;
const HIDDEN_OFFSET = -750;

const ENTER_ANIMATION_DURATION = 200;
const EXIT_ANIMATION_DURATION = 1000;
const NOTIFICATION_VISIBLE_DURATION = 5000 + ENTER_ANIMATION_DURATION + EXIT_ANIMATION_DURATION;

const notificationContainerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: utils.spacings.small / 2,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.backgroundNeutralBold,
    paddingHorizontal: utils.spacings.small / 2,
    ...utils.boxShadows.small,
}));

export const Notification = ({
    iconLeft,
    iconRight,
    title,
    description,
    onPress,
    isHiddenAutomatically = true,
}: NotificationProps) => {
    const [isHidden, setIsHidden] = useState(false);
    const { applyStyle } = useNativeStyles();

    const translateY = useSharedValue(0);

    const onSwipeGesture = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
        onActive: event => {
            if (event.translationY <= 0) translateY.value = event.translationY;
        },
        onEnd: event => {
            if (event.translationY < DISMISS_THRESHOLD) {
                translateY.value = withTiming(HIDDEN_OFFSET, undefined, isFinished => {
                    if (isFinished) runOnJS(setIsHidden)(true);
                });
            } else {
                translateY.value = withTiming(0);
            }
        },
    });

    useEffect(() => {
        const timeout = setTimeout(
            () => isHiddenAutomatically && setIsHidden(true),
            NOTIFICATION_VISIBLE_DURATION,
        );
        return () => clearTimeout(timeout);
    }, [isHiddenAutomatically]);

    const swipeGestureStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: translateY.value,
            },
        ],
    }));

    if (isHidden) return null;

    return (
        <InvertedThemeProvider>
            <PanGestureHandler onGestureEvent={onSwipeGesture}>
                <Animated.View
                    style={swipeGestureStyle}
                    entering={SlideInUp.duration(ENTER_ANIMATION_DURATION)}
                    exiting={SlideOutUp.duration(EXIT_ANIMATION_DURATION)}
                >
                    <TouchableWithoutFeedback onPress={onPress}>
                        <Box style={applyStyle(notificationContainerStyle)}>
                            <Box flexDirection="row" alignItems="center">
                                {iconLeft}
                                <Box marginLeft="medium">
                                    <Text>{title}</Text>
                                    <Text variant="label">{description}</Text>
                                </Box>
                            </Box>
                            <Box marginRight="small">{iconRight}</Box>
                        </Box>
                    </TouchableWithoutFeedback>
                </Animated.View>
            </PanGestureHandler>
        </InvertedThemeProvider>
    );
};
