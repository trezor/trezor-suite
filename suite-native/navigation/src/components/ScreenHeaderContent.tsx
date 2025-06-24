import React, { ReactNode, useEffect } from 'react';
import { LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Box, Text } from '@suite-native/atoms';

import { useScrollDivider } from '../useScrollDivider';

type ScreenHeaderContentProps = {
    content: ReactNode;
};

const ANIMATION_DURATION = 500;

export const ScrollViewScreenHeader = ({
    content,
    subtitle,
}: {
    content?: ReactNode;
    subtitle?: ReactNode;
}) => {
    const { setHeight } = useScrollDivider();

    const handleLayout = (e: LayoutChangeEvent) => {
        console.warn(`Layout: ${e.nativeEvent.layout.height}`);
        setHeight(e.nativeEvent.layout.height);
    };

    return (
        <Box paddingHorizontal="sp16" marginTop="sp16" marginBottom="sp8" onLayout={handleLayout}>
            <Text variant="titleMedium">{content}</Text>
            {subtitle && <Text>{subtitle}</Text>}
        </Box>
    );
};

export const ScreenHeaderContent = ({ content }: ScreenHeaderContentProps) => {
    const { isScrolled } = useScrollDivider();

    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(isScrolled ? 1 : 0, { duration: ANIMATION_DURATION });
    }, [isScrolled, opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.Text style={animatedStyle}>
            <Text
                variant="highlight"
                adjustsFontSizeToFit
                numberOfLines={1}
                testID="@screen/sub-header/title"
            >
                {content}
            </Text>
        </Animated.Text>
    );
};
