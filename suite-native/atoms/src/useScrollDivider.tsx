import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import { type NativeScrollEvent } from 'react-native/Libraries/Components/ScrollView/ScrollView';
import { type NativeSyntheticEvent } from 'react-native/Libraries/Types/CoreEventTypes';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AnimatedView } from './AnimatedView';

const scrollDividerStyle = prepareNativeStyle(({ borders, colors }) => ({
    marginTop: -borders.widths.small,
    borderTopWidth: borders.widths.small,
    borderTopColor: colors.borderNeutral,
}));

const ScrollDivider = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <AnimatedView entering={FadeIn.duration(500)} exiting={FadeOut.duration(250)}>
            <View style={applyStyle(scrollDividerStyle)} />
        </AnimatedView>
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
