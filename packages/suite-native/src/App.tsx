import React, { useCallback, useEffect, useState } from 'react';
import {
    Button,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    useColorScheme,
} from 'react-native';

import { enumerate } from '@trezor/transport-native';
import { Colors, Header } from 'react-native/Libraries/NewAppScreen';
import TrezorConnect from 'trezor-connect';

const styles = StyleSheet.create({
    sectionContainer: {
        marginTop: 32,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
    },
    sectionDescription: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: '400',
    },
    highlight: {
        fontWeight: '700',
    },
});

const Section = ({ children, title }: any) => {
    const isDarkMode = useColorScheme() === 'dark';
    return (
        <View style={styles.sectionContainer}>
            <Text
                style={[
                    styles.sectionTitle,
                    {
                        color: isDarkMode ? Colors.white : Colors.black,
                    },
                ]}
            >
                {title}
            </Text>
            <Text
                style={[
                    styles.sectionDescription,
                    {
                        color: isDarkMode ? Colors.light : Colors.dark,
                    },
                ]}
            >
                {children}
            </Text>
        </View>
    );
};

const connectSrc = process.env.TREZOR_CONNECT_SRC || 'https://localhost:8088/';

const connectOptions = {
    connectSrc,
    webusb: true,
    transportReconnect: true,
    popup: true,
    debug: true,
    lazyLoad: true,
    manifest: {
        email: 'info@trezor.io',
        appUrl: '@trezor/suite',
    },
};
export const App = () => {
    const isDarkMode = useColorScheme() === 'dark';
    const [connectStatus, setConnectStatus] = useState<any>('');
    const [deviceState, setDeviceState] = useState<any>('');
    const [transportDevices, setTransportDevices] = useState<any>('');

    const backgroundStyle = {
        backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    };

    console.log(Buffer);

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

    const resetDevice = useCallback(() => {
        TrezorConnect.resetDevice({
            label: 'Meow trezor',
            skip_backup: true,
        });
    }, []);

    const getDevices = useCallback(() => {
        enumerate()
            .then(result => {
                console.log('transport-native', result);
                setTransportDevices(JSON.stringify(result));
            })
            .catch(error => {
                console.log('transport-native error', error);
                setTransportDevices(JSON.stringify(error));
            });
    }, []);

    useEffect(() => {
        TrezorConnect.init(connectOptions)
            .then(result => {
                setConnectStatus('Init OK');
                console.log(result);
            })
            .catch(error => {
                setConnectStatus(`Init failed ${JSON.stringify(error.code)}`);
            });
    }, [getFeatures]);

    useEffect(() => {
        setInterval(() => {
            console.log('tick', new Date().toLocaleTimeString());
        }, 1000);
        setInterval(() => {
            // getDevices();
        }, 3000);
    }, []);

    return (
        <SafeAreaView style={backgroundStyle}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <ScrollView contentInsetAdjustmentBehavior="automatic" style={backgroundStyle}>
                <Header />
                <View
                    style={{
                        backgroundColor: isDarkMode ? Colors.black : Colors.white,
                    }}
                >
                    <Section title="transport-native status">
                        {transportDevices}
                        <Button title="get devices" onPress={getDevices} />
                    </Section>
                    <Section title="Connect status">{connectStatus}</Section>
                    <Section title="Device features">
                        <Button title="get device state" onPress={getFeatures} />
                        {deviceState}
                    </Section>
                    <Section title="Device management">
                        <Button title="reset device" onPress={resetDevice} />
                    </Section>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};
