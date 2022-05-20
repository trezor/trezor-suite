import React from 'react';
import { View } from 'react-native';
import { Text } from '@trezor/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const accountScreenStyle = prepareNativeStyle(() => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
}));

export const AccountsScreen = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={[applyStyle(accountScreenStyle)]}>
            <Text>Accounts content</Text>
        </View>
    );
};
