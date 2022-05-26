import React from 'react';

import { RootTabNavigator } from '@suite-native/navigation-root';
import { StylesProvider, createRenderer } from '@trezor/styles';
import { prepareNativeTheme } from '@trezor/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const renderer = createRenderer();

export const App = () => {
    const theme = prepareNativeTheme({ colorVariant: 'standard' });

    return (
        <SafeAreaProvider>
            <StylesProvider theme={theme} renderer={renderer}>
                <RootTabNavigator />
            </StylesProvider>
        </SafeAreaProvider>
    );
};
