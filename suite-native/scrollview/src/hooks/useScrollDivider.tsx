import React, { useCallback, useState } from 'react';
import { type ScrollEvent, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const scrollDividerStyle = prepareNativeStyle(({ borders, colors }) => ({
    marginTop: -borders.widths.small,
    borderTopWidth: borders.widths.small,
    borderTopColor: colors.borderNeutral,
}));

const ScrollDivider = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(250)}>
            <View style={applyStyle(scrollDividerStyle)} />
        </Animated.View>
    );
};

export const useScrollDivider = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    const handleScroll = useCallback(({ nativeEvent }: ScrollEvent) => {
        setIsScrolled(nativeEvent.contentOffset.y > 0);
    }, []);

    return {
        scrollDivider: isScrolled ? <ScrollDivider /> : undefined,
        handleScroll,
    };
};
