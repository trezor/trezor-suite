import { Button, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';

import TrezorConnect from '@trezor/connect-mobile';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dataContainer: {
        marginTop: 20,
        alignItems: 'flex-start',
    },
});

export const App = () => {
    const [errorData, setErrorData] = useState<any>(null);
    const [successData, setSuccessData] = useState<any>(null);
    const isEmulator = true;

    const initialize = () => {
        TrezorConnect.init({
            manifest: {
                email: 'developer@xyz.com',
                appUrl: 'http://your.application.com',
            },
            // for local development purposes. for production, leave it undefined to use the default value.
            connectSrc: isEmulator ? 'trezorsuitelite://connect' : undefined,
            deeplinkOpen: url => {
                // eslint-disable-next-line no-console
                console.log('deeplinkOpen', url);
                Linking.openURL(url);
            },
            deeplinkCallbackUrl: Linking.createURL('/connect'),
        });
    };

    const getAddress = async () => {
        try {
            const response = await TrezorConnect.getAddress({
                path: "m/49'/0'/0'/0/0",
                coin: 'btc',
            });
            if (!response.success) {
                setSuccessData(null);
                setErrorData({ success: response.success });

                return;
            }
            setErrorData(null);
            setSuccessData(response);
        } catch (error) {
            console.error('error', error);
        }
    };

    const signMessage = async () => {
        try {
            const response = await TrezorConnect.signMessage({
                path: "m/49'/0'/0'/0/0",
                message: 'Hello from mobile app!',
            });
            if (!response.success) {
                setSuccessData(null);
                setErrorData({ success: response.success });

                return;
            }
            setErrorData(null);
            setSuccessData(response);
        } catch (error) {
            console.error('error', error);
        }
    };

    useEffect(() => {
        const subscription = Linking.addEventListener('url', event => {
            TrezorConnect.handleDeeplink(event.url);
        });

        return () => subscription?.remove();
    }, []);

    return (
        <View style={styles.container}>
            <Text>Trezor Connect Native example!</Text>
            <Button onPress={initialize} title="Initialize TrezorConnect" />
            <Button onPress={getAddress} title="Get Address" />
            <Button onPress={signMessage} title="Sign Message" />

            {successData && (
                <View style={styles.dataContainer}>
                    <Text>Success: {successData.success ? 'Yes' : 'No'}</Text>
                    {successData.payload?.address && (
                        <Text>Address: {successData.payload?.address}</Text>
                    )}
                    {successData.payload?.path && (
                        <Text>Path: {successData.payload?.path.join(', ')}</Text>
                    )}
                    {successData.payload?.serializedPath && (
                        <Text>Serialized Path: {successData.payload?.serializedPath}</Text>
                    )}
                    {successData.payload?.signature && (
                        <Text>Signature: {successData.payload?.signature}</Text>
                    )}
                </View>
            )}

            {errorData && (
                <View style={styles.dataContainer}>
                    <Text>Success: {errorData.success ? 'Yes' : 'No'}</Text>
                </View>
            )}
            <StatusBar style="auto" />
        </View>
    );
};
