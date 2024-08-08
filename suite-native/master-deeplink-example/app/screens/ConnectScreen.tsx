import { Text, View, StyleSheet, Button } from 'react-native';
import { useState, useEffect } from 'react';

import * as Linking from 'expo-linking';

const createResponseUrl = (baseUrl: string, method: string, payload: object): string => {
    const encodePayload = (obj: object): string => {
        return encodeURIComponent(JSON.stringify(obj));
    };

    const payloadString = encodePayload(payload);

    const finalUrl = `${baseUrl}?method=${method}\\&payload=${payloadString}`;

    return finalUrl;
};

export const ConnectScreen = ({ data }: any) => {
    const [callback, setCallback] = useState(null);

    useEffect(() => {
        if (data?.queryParams) {
            const { callbackDeeplink, method, payload } = data.queryParams;
            console.log('callbackDeeplink', callbackDeeplink);
            console.log('method', method);
            console.log('payload', payload);
            setCallback(callbackDeeplink);
        }
    }, [data]);

    const handleButtonPress = () => {
        console.log('handleButtonPress');
        console.log('callback', callback);
        const payload = {
            signatures: {
                0: '30440220714c3704cb9aee785a5e03eb77eacf5bd95d29a4fe9cf33e4a868aa4100d2b6902207c5bdef296404d3fedeaaa71579140768b72c0bea882c7a2f16c029963d7c622',
                serializedTx:
                    '01000000016d20f69067ad1ffd50ee7c0f377dde2c932ccb03e84b5659732da99c20f1f650010000006a4730440220714c3704cb9aee785a5e03eb77eacf5bd95d29a4fe9cf33e4a868aa4100d2b6902207c5bdef296404d3fedeaaa71579140768b72c0bea882c7a2f16c029963d7c622012102a7a079c1ef9916b289c2ff21a992c808d0de3dfcf8a9f163205c5c9e21f55d5cffffffff0110270000000000002200201863143c14c5166804bd19203356da136c985678cd4d27a1b8c632960490326200000000',
            },
        };
        if (callback) {
            const callbackLink = createResponseUrl(callback, 'signTransaction', payload);
            console.log('calling callbackLink', callbackLink);
            Linking.openURL(callbackLink).catch(err => console.error('An error occurred', err));
        }
    };
    return (
        <View style={styles.container}>
            <Text>Trezor Connect in Suite</Text>
            {data && <Text>Received Data: {JSON.stringify(data)}</Text>}
            {callback && <Button title="Sign In Device" onPress={handleButtonPress} />}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
});
