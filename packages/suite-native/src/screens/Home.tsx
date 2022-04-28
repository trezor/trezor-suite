import React, { useCallback, useEffect, useState } from 'react';
import {
    Button,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    useColorScheme,
    View,
} from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import TrezorConnect from 'trezor-connect';

const backgroundStyle = prepareNativeStyle<{ isDarkMode: boolean }>(
    ({ colors, spacings }, { isDarkMode }) => ({
        backgroundColor: isDarkMode ? colors.black : colors.white,
        padding: spacings.lg,
        marginTop: spacings.lg,
    }),
);

const connectOptions = {
    transportReconnect: true,
    debug: true,
    manifest: {
        email: 'info@trezor.io',
        appUrl: '@trezor/suite',
    },
};

export const Home = () => {
    const isDarkMode = useColorScheme() === 'dark';
    const [connectStatus, setConnectStatus] = useState<any>('');
    const [deviceState, setDeviceState] = useState<any>('');
    const { applyStyle } = useNativeStyles();

    const getFeatures = useCallback(() => {
        console.log('getting features');
        TrezorConnect.getDeviceState()
            .then(state => {
                setDeviceState(JSON.stringify(state));
                console.log(state);
            })
            .catch(error => {
                console.log(`get device state failed ${JSON.stringify(error)}`);
            });
    }, []);

    useEffect(() => {
        // prevent errors spam on iOS
        if (Platform.OS === 'android') {
            TrezorConnect.init(connectOptions)
                .then(result => {
                    setConnectStatus('Init OK');
                    console.log(result);
                    getFeatures();
                })
                .catch(error => {
                    setConnectStatus(`Init failed ${JSON.stringify(error.code)}`);
                });
        }
    }, [getFeatures]);

    return (
        <SafeAreaView style={applyStyle(backgroundStyle, { isDarkMode })}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                style={applyStyle(backgroundStyle, { isDarkMode })}
            >
                <View>
                    <Text>Connect status: {connectStatus}</Text>
                    <Button title="get device state" onPress={getFeatures} />

                    <Text>Device features: {deviceState}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};
