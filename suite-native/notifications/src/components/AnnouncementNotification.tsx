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

type AnnouncementNotificationProps = {
    iconLeft?: ReactNode;
    iconRight?: ReactNode;
    title: string;
    description: ReactNode;
    onPress: () => void;
    isHiddenAutomatically?: boolean;
};

const DISMISS_THRESHOLD = -25;

const ENTER_ANIMATION_DURATION = 200;
const EXIT_ANIMATION_DURATION = 1000;
const NOTIFICATION_VISIBLE_DURATION = 5000 + ENTER_ANIMATION_DURATION + EXIT_ANIMATION_DURATION;

const notificationContainerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: utils.spacings.small / 2,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.gray1000,
    paddingHorizontal: utils.spacings.small / 2,
    ...utils.boxShadows.small,
}));

export const AnnouncementNotification = ({
    iconLeft,
    iconRight,
    title,
    description,
    onPress,
    isHiddenAutomatically = true,
}: AnnouncementNotificationProps) => {
    const [isHidden, setIsHidden] = useState(false);
    const { applyStyle } = useNativeStyles();

    const translateY = useSharedValue(0);

    const onSwipeGesture = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
        onActive: event => {
            if (event.translationY <= 0) translateY.value = event.translationY;
        },
        onEnd: event => {
            if (event.translationY < DISMISS_THRESHOLD) {
                translateY.value = withTiming(-700, undefined, isFinished => {
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
    });

    const swipeGestureStyle = useAnimatedStyle(() => ({
        transform: [
            {
                translateY: translateY.value,
            },
        ],
    }));

    if (isHidden) return null;

    return (
        <PanGestureHandler onGestureEvent={onSwipeGesture}>
            <TouchableWithoutFeedback onPress={onPress}>
                <Animated.View
                    style={[applyStyle(notificationContainerStyle), swipeGestureStyle]}
                    entering={SlideInUp.duration(ENTER_ANIMATION_DURATION)}
                    exiting={SlideOutUp.duration(EXIT_ANIMATION_DURATION)}
                >
                    <Box flexDirection="row" alignItems="center">
                        {iconLeft}
                        <Box marginLeft="medium">
                            <Text color="gray0">{title}</Text>
                            <Text variant="label" color="gray600">
                                {description}
                            </Text>
                        </Box>
                    </Box>
                    <Box marginRight="small">{iconRight}</Box>
                </Animated.View>
            </TouchableWithoutFeedback>
        </PanGestureHandler>
    );
};
