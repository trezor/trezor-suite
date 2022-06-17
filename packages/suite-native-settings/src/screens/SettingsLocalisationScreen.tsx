import React from 'react';
import { View } from 'react-native';

import { Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const screenStyle = prepareNativeStyle(() => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
}));

export const SettingsLocalisationScreen = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={[applyStyle(screenStyle)]}>
            <Text>Localisation screen</Text>
        </View>
    );
};
