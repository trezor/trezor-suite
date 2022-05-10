import React, { useCallback, useEffect, useState } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, useColorScheme, View } from 'react-native';

import { Text, Box, Button } from '@trezor/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import TrezorConnect from 'trezor-connect';

const backgroundStyle = prepareNativeStyle<{ isDarkMode: boolean }>(
    ({ colors, spacings }, { isDarkMode }) => ({
        backgroundColor: isDarkMode ? colors.black : colors.white,
        padding: spacings.lg,
        marginTop: 0,
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
                setDeviceState(`${Math.random()} ${JSON.stringify(state)}`);
            })
            .catch(error => {
                console.log(`get device state failed ${JSON.stringify(error)}}`);
                setDeviceState(`${Math.random()}`);
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
    console.log('rerender Home');

    return (
        <SafeAreaView style={applyStyle(backgroundStyle, { isDarkMode })}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                style={applyStyle(backgroundStyle, { isDarkMode })}
            >
                <View>
                    <Box marginTop="lg">
                        <Text variant="titleLarge">Title Large</Text>
                    </Box>
                    <Box>
                        <Text variant="titleMedium">Title Medium</Text>
                    </Box>
                    <Box>
                        <Text variant="titleSmall">Title Small</Text>
                    </Box>
                    <Box>
                        <Text variant="highlight">Highlight</Text>
                    </Box>
                    <Box>
                        <Text variant="body">Body</Text>
                    </Box>
                    <Box>
                        <Text variant="callout">Callout</Text>
                    </Box>
                    <Box>
                        <Text variant="hint">Hint</Text>
                    </Box>
                    <Box>
                        <Text variant="label">Label</Text>
                    </Box>
                    <Box marginVertical="lg">
                        <Button onPress={getFeatures} size="md" colorScheme="primary">
                            My Fancy Button
                        </Button>
                    </Box>

                    <Box>
                        <Text variant="highlight">Connect status:</Text>
                        <Text>{connectStatus}</Text>
                    </Box>

                    <Button onPress={getFeatures} size="md" colorScheme="primary">
                        get device state
                    </Button>
                    <Text>Device features: {deviceState}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};
