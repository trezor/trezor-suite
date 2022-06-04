import React from 'react';
import { View } from 'react-native';
import { Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { SettingsStackRoutes, SettingsStackParamList } from '../navigation/routes';
import { StackProps } from '@suite-native/navigation';

const settingsDetailScreenStyle = prepareNativeStyle(() => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
}));

export const SettingsDetailScreen = ({
    route,
}: StackProps<SettingsStackParamList, SettingsStackRoutes.SettingsDetail>) => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={[applyStyle(settingsDetailScreenStyle)]}>
            <Text>{route.params.message}</Text>
        </View>
    );
};
