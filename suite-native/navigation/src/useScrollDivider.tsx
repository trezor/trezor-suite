import React, { useCallback, useState } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { NativeScrollEvent } from 'react-native/Libraries/Components/ScrollView/ScrollView';
import { NativeSyntheticEvent } from 'react-native/Libraries/Types/CoreEventTypes';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const scrollDividerStyle = prepareNativeStyle(({ borders, colors }) => ({
    marginTop: -borders.widths.small,
    borderTopWidth: borders.widths.small,
    borderTopColor: colors.borderElevation0,
}));

const ScrollDivider = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(250)}>
            <Box style={applyStyle(scrollDividerStyle)} />
        </Animated.View>
    );
};

export const useScrollDivider = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    const handleScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        setIsScrolled(nativeEvent.contentOffset.y > 0);
    }, []);

    return {
        scrollDivider: isScrolled ? <ScrollDivider /> : undefined,
        handleScroll,
    };
};
