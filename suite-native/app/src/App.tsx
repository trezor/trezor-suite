import React from 'react';

import { StylesProvider, createRenderer } from '@trezor/styles';
import { prepareNativeTheme } from '@trezor/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootTabNavigator } from './navigation/RootTabNavigator';

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
