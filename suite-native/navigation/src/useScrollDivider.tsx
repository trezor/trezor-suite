import React from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { atom, useAtom } from 'jotai';
import { NativeScrollEvent } from 'react-native/Libraries/Components/ScrollView/ScrollView';
import { NativeSyntheticEvent } from 'react-native/Libraries/Types/CoreEventTypes';

import { Box } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const scrollDividerStyle = prepareNativeStyle(({ borders, colors }) => ({
    marginTop: -borders.widths.small,
    borderTopWidth: borders.widths.small,
    borderTopColor: colors.borderElevation0,
}));

export const isScrolledAtom = atom(false);
export const heightAtom = atom(0);

const ScrollDivider = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Animated.View entering={FadeIn.duration(500)} exiting={FadeOut.duration(250)}>
            <Box style={applyStyle(scrollDividerStyle)} />
        </Animated.View>
    );
};

export const useScrollDivider = () => {
    const [isScrolled, setIsScrolled] = useAtom(isScrolledAtom);
    const [height, setHeight] = useAtom(heightAtom);

    const handleScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        setIsScrolled(nativeEvent.contentOffset.y > height);
    };

    return {
        scrollDivider: isScrolled ? <ScrollDivider /> : undefined,
        handleScroll,
        isScrolled,
        setHeight,
    };
};
