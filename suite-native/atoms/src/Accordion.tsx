import React, { useCallback, useRef, useState } from 'react';
import { NativeSyntheticEvent, Pressable, TextLayoutEventData, View } from 'react-native';
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

const accordionStyle = prepareNativeStyle(utils => ({
    borderBottomColor: utils.colors.borderOnElevation1,
    borderBottomWidth: 1,
}));

const triggerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: utils.spacings.small,
}));

const iconStyle = prepareNativeStyle(utils => ({
    borderWidth: 1,
    borderColor: utils.colors.iconPrimaryDefault,
    borderRadius: utils.borders.radii.round,
}));

const ANIMATION_DURATION = 500;

export const Accordion = ({ title, content }: AccordionProps) => {
    const { applyStyle } = useNativeStyles();
    const [isOpen, setIsOpen] = useState(false);
    const height = useSharedValue<string | number>(0);

    const animationStyle = useAnimatedStyle(() => ({
        height: `${height.value}%`,
        overflow: 'hidden',
    }));

    const toggleOpen = useCallback(() => {
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
    }, [isOpen, height]);

    return (
        <Pressable onPress={toggleOpen} style={applyStyle(accordionStyle)}>
            <Box>
                <Box style={applyStyle(triggerStyle)}>
                    <Text>{title}</Text>
                    <Box style={applyStyle(iconStyle)}>
                        <Icon name="plus" color="iconPrimaryDefault" />
                    </Box>
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
