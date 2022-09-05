import React from 'react';
import { View } from 'react-native';

import { Text } from '@suite-native/atoms';
import { TabProps, AppTabsRoutes } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { AppTabsParamList } from '@suite-native/module-home';

const pricesScreenStyle = prepareNativeStyle(() => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
}));

export const PricesScreen: React.FC<TabProps<AppTabsParamList, AppTabsRoutes.Prices>> = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <View style={[applyStyle(pricesScreenStyle)]}>
            <Text>Prices content</Text>
        </View>
    );
};
