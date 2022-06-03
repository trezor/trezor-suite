import React from 'react';
import { View } from 'react-native';
import { Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const actionScreenStyle = prepareNativeStyle(() => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
}));

export const ActionScreen = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={[applyStyle(actionScreenStyle)]}>
            <Text>Action content</Text>
        </View>
    );
};
