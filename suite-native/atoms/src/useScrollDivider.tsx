import React, { useCallback, useState } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AnimatedView } from './Animated/AnimatedView';

const scrollDividerStyle = prepareNativeStyle<{ left: number; right: number }>(
    ({ borders, colors }, { left, right }) => ({
        marginLeft: left,
        marginRight: right,
        marginTop: -borders.widths.small,
        borderTopWidth: borders.widths.small,
        borderTopColor: colors.borderNeutral,
    }),
);

type HorizontalInsets = { left: number; right: number };

const ScrollDivider = ({ left, right }: HorizontalInsets) => {
    const { applyStyle } = useNativeStyles();

    return (
        <AnimatedView entering={FadeIn.duration(500)} exiting={FadeOut.duration(250)}>
            <View style={applyStyle(scrollDividerStyle, { left, right })} />
        </AnimatedView>
    );
};

export const useScrollDivider = (horizontalInsets: HorizontalInsets = { left: 0, right: 0 }) => {
    const [isScrolled, setIsScrolled] = useState(false);

    const handleScroll = useCallback(({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        setIsScrolled(nativeEvent.contentOffset.y > 0);
    }, []);

    return {
        scrollDivider: isScrolled ? <ScrollDivider {...horizontalInsets} /> : undefined,
        handleScroll,
    };
};
