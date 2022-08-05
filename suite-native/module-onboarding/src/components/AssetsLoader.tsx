import { View } from 'react-native';
import React from 'react';

import { Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const fetchingStyle = prepareNativeStyle(() => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
}));

const textStyle = prepareNativeStyle<{ opacity?: number }>((_, { opacity = 1.0 }) => ({
    marginBottom: 13,
    opacity,
}));

export const AssetsLoader = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={[applyStyle(fetchingStyle)]}>
            <Text variant="titleMedium" color="black" style={applyStyle(textStyle)}>
                Checking Balances...
            </Text>
            <Text
                variant="titleMedium"
                color="black"
                style={applyStyle(textStyle, { opacity: 0.3 })}
            >
                Fetching tx history...
            </Text>
            <Text
                variant="titleMedium"
                color="black"
                style={applyStyle(textStyle, { opacity: 0.1 })}
            >
                something...
            </Text>
        </View>
    );
};
