import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { Icon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from './Box';
import { Text } from './Text';

type AccordionProps = {
    title: string;
    content: string;
};

const triggerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: utils.spacings.small,
}));

const ANIMATION_DURATION = 500;

export const Accordion = ({ title, content }: AccordionProps) => {
    const { applyStyle } = useNativeStyles();
    const [isOpen, setIsOpen] = useState(false);
    const height = useSharedValue(0);

    const animationStyle = useAnimatedStyle(() => ({
        height: `${height.value}%`,
        overflow: 'hidden',
    }));

    const toggleOpen = () => {
        if (!isOpen) {
            height.value = withTiming(100, {
                duration: ANIMATION_DURATION,
                easing: Easing.ease,
            });
        } else {
            height.value = withTiming(0, {
                duration: ANIMATION_DURATION,
                easing: Easing.out(Easing.cubic),
            });
        }
        setIsOpen(!isOpen);
    };

    return (
        <Pressable onPress={toggleOpen}>
            <Box>
                <Box style={applyStyle(triggerStyle)}>
                    <Text>{title}</Text>
                    <Icon name="plusCircle" color="iconPrimaryDefault" />
                </Box>
                <Box flexDirection="row">
                    <Animated.View style={animationStyle}>
                        <View>
                            <Text>{content}</Text>
                        </View>
                    </Animated.View>
                </Box>
            </Box>
        </Pressable>
    );
};
