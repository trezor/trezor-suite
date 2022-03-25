import React, { useCallback, useEffect, useState } from 'react';
import {
    Button,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from 'react-native';

import { Colors, Header } from 'react-native/Libraries/NewAppScreen';
import TrezorConnect from 'trezor-connect';

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

const connectOptions = {
    transportReconnect: true,
    debug: true,
    manifest: {
        email: 'info@trezor.io',
        appUrl: '@trezor/suite',
    },
};

export const App = () => {
    const isDarkMode = useColorScheme() === 'dark';
    const [connectStatus, setConnectStatus] = useState<any>('');
    const [deviceState, setDeviceState] = useState<any>('');

    const backgroundStyle = {
        backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    };

    const getFeatures = useCallback(() => {
        console.log('getting features');
        TrezorConnect.getDeviceState()
            .then(state => {
                setDeviceState(state);
                console.log(state);
            })
            .catch(error => {
                console.log('get device state failed ' + JSON.stringify(error));
            });
    }, []);

    useEffect(() => {
        TrezorConnect.init(connectOptions)
            .then(result => {
                setConnectStatus('Init OK');
                console.log(result);
                getFeatures();
            })
            .catch(error => {
                setConnectStatus('Init failed ' + JSON.stringify(error.code));
            });
    }, [getFeatures]);

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
                    <Section title="Connect status">{connectStatus}</Section>
                    <Section title="Device features">
                        <Button title="get device state" onPress={getFeatures} />
                        {deviceState}
                    </Section>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

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
