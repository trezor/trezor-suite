import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { networkSymbolCollection } from '@suite-common/wallet-config';
import { NetworkIcon } from '@suite-native/icons';
import { IntlProvider } from '@suite-native/intl';
import { StoreProvider, initStore } from '@suite-native/state';

import { StylesProvider } from './StylesProvider';

const ICON_BATCH_COUNT = 4;
const ICON_MOUNT_TOGGLE_INTERVAL_MS = 500;

const stressIcons = Array.from({ length: ICON_BATCH_COUNT }).flatMap((_, batchIndex) =>
    networkSymbolCollection.map(symbol => ({
        key: `${batchIndex}-${symbol}`,
        symbol,
    })),
);

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        padding: 16,
        backgroundColor: '#ffffff',
    },
    title: {
        marginBottom: 8,
        color: '#000000',
        fontSize: 18,
        fontWeight: '600',
    },
    status: {
        marginBottom: 12,
        color: '#000000',
    },
    controls: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    button: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#00854d',
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '600',
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        gap: 4,
    },
});

const NetworkIconStressScreen = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [areIconsMounted, setAreIconsMounted] = useState(false);
    const [cycle, setCycle] = useState(0);

    useEffect(() => {
        if (!isRunning) {
            return undefined;
        }

        const intervalId = setInterval(() => {
            setAreIconsMounted(iconsMounted => !iconsMounted);
            setCycle(currentCycle => currentCycle + 1);
        }, ICON_MOUNT_TOGGLE_INTERVAL_MS);

        return () => clearInterval(intervalId);
    }, [isRunning]);

    const startStressTest = () => {
        setCycle(0);
        setAreIconsMounted(true);
        setIsRunning(true);
    };

    const stopStressTest = () => {
        setIsRunning(false);
        setAreIconsMounted(false);
    };

    return (
        <View style={styles.screen} testID="@screen/NetworkIconStress">
            <Text style={styles.title}>NetworkIcon surface lifecycle stress test</Text>
            <Text style={styles.status} testID="@networkIconStress/status">
                {isRunning
                    ? `Running cycle ${cycle} with ${stressIcons.length} icons per mount`
                    : 'Idle'}
            </Text>
            <View style={styles.controls}>
                <Pressable
                    accessibilityRole="button"
                    disabled={isRunning}
                    onPress={startStressTest}
                    style={styles.button}
                    testID="@networkIconStress/start"
                >
                    <Text style={styles.buttonText}>Start</Text>
                </Pressable>
                <Pressable
                    accessibilityRole="button"
                    disabled={!isRunning}
                    onPress={stopStressTest}
                    style={styles.button}
                    testID="@networkIconStress/stop"
                >
                    <Text style={styles.buttonText}>Stop</Text>
                </Pressable>
            </View>
            {areIconsMounted && (
                <View style={styles.iconGrid} testID="@networkIconStress/icons">
                    {stressIcons.map(({ key, symbol }) => (
                        <NetworkIcon key={key} symbol={symbol} size="extraLarge" />
                    ))}
                </View>
            )}
        </View>
    );
};

const store = initStore();

export const App = () => (
    <StoreProvider store={store}>
        <IntlProvider>
            <SafeAreaProvider>
                <StylesProvider>
                    <NetworkIconStressScreen />
                </StylesProvider>
            </SafeAreaProvider>
        </IntlProvider>
    </StoreProvider>
);
