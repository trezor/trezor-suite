import React, { ReactNode, useState } from 'react';
import { Pressable } from 'react-native';
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
    content: ReactNode;
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

export const Accordion = ({ title, content }: AccordionProps) => {
    const { applyStyle } = useNativeStyles();
    const [isOpen, setIsOpen] = useState(false);
    const height = useSharedValue(0);

    const animationStyle = useAnimatedStyle(() => ({
        height: height.value,
    }));

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            height.value = withTiming(100, { duration: 500, easing: Easing.ease });
        } else {
            height.value = withTiming(0, { duration: 500, easing: Easing.ease });
        }
    };

    return (
        <Pressable onPress={toggleOpen} style={applyStyle(accordionStyle)}>
            <Box style={applyStyle(triggerStyle)}>
                <Text>{title}</Text>
                <Box style={applyStyle(iconStyle)}>
                    <Icon name="plus" color="iconPrimaryDefault" />
                </Box>
            </Box>
            <Box flex={1}>
                {isOpen && (
                    <Animated.View style={animationStyle}>
                        <Text>{content}</Text>
                    </Animated.View>
                )}
            </Box>
        </Pressable>
    );
};
