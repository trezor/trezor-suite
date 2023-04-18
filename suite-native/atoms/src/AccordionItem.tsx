import React, { ReactNode, useState } from 'react';
import { Pressable } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    withDelay,
} from 'react-native-reanimated';

import { Icon, IconName } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from './Box';
import { Text } from './Text';

type AccordionItemProps = {
    title: string;
    content: ReactNode;
};

const triggerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: utils.spacings.small,
}));

const titleStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
}));

const ANIMATION_DURATION = 250;

export const AccordionItem = ({ title, content }: AccordionItemProps) => {
    const { applyStyle } = useNativeStyles();
    const [isOpen, setIsOpen] = useState(false);
    const height = useSharedValue(0);
    const textOpacity = useSharedValue(0);

    const accordionAnimationStyle = useAnimatedStyle(() => ({
        height: `${height.value}%`,
        overflow: 'hidden',
    }));

    const textAnimationStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
    }));

    const toggleOpen = () => {
        if (!isOpen) {
            height.value = withTiming(100, {
                duration: ANIMATION_DURATION,
                easing: Easing.ease,
            });
            textOpacity.value = withDelay(
                ANIMATION_DURATION,
                withTiming(1, { duration: ANIMATION_DURATION }),
            );
        } else {
            textOpacity.value = withTiming(0, { duration: ANIMATION_DURATION });
            height.value = withDelay(
                ANIMATION_DURATION,
                withTiming(1, {
                    duration: ANIMATION_DURATION,
                    easing: Easing.out(Easing.cubic),
                }),
            );
        }
        setIsOpen(!isOpen);
    };

    const icon: IconName = isOpen ? 'minusCircle' : 'plusCircle';

    return (
        <Pressable onPress={toggleOpen}>
            <Box>
                <Box style={applyStyle(triggerStyle)}>
                    <Text style={applyStyle(titleStyle)}>{title}</Text>
                    <Icon name={icon} color="iconPrimaryDefault" />
                </Box>
                <Box flexDirection="row">
                    <Animated.View style={accordionAnimationStyle}>
                        <Animated.View style={textAnimationStyle}>
                            <Text variant="label">{content}</Text>
                        </Animated.View>
                    </Animated.View>
                </Box>
            </Box>
        </Pressable>
    );
};
