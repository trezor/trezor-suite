import { Button, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';

import TrezorConnect from '@trezor/connect-deeplink';

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

    const initialize = () => {
        TrezorConnect.init({
            manifest: {
                email: 'developer@xyz.com',
                appUrl: 'http://your.application.com',
            },
            deeplinkOpen: url => {
                Linking.openURL(url);
            },
            // TODO: prepare example app to use schema: connectdeeplinkexample or similar.
            deeplinkCallbackUrl: 'exp://192.168.61.157:8081/--/connect',
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
            {successData && (
                <View style={styles.dataContainer}>
                    <Text>Success: {successData.success ? 'Yes' : 'No'}</Text>
                    <Text>Address: {successData.payload?.address}</Text>
                    <Text>Path: {successData.payload?.path.join(', ')}</Text>
                    <Text>Serialized Path: {successData.payload?.serializedPath}</Text>
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
