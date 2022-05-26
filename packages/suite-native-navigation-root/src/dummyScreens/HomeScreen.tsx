import React from 'react';
import { View } from 'react-native';
import { TabProps } from '@suite-native/navigation';
import { Text } from '@trezor/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { RootTabsParamList, RouteTabs } from '../navigation/routes';

const homeScreenStyle = prepareNativeStyle(() => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
}));

export const HomeScreen: React.FC<TabProps<RootTabsParamList, RouteTabs.Prices>> = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={[applyStyle(homeScreenStyle)]}>
            <Text>Home content</Text>
        </View>
    );
};
