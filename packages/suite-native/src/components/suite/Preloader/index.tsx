/**
 * File corresponding with @native-components/suite/Preloader
 * Differences:
 * - SafeAreaView wrapper (react-navigation)
 * - No "OnlineStatus" component (@native/support/suite/OnlineStatus is using "window" object)
 */

import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { SUITE } from '@suite-actions/constants';
import { useTheme } from '@trezor/components';
import { useSelector, useActions } from '@suite-hooks';
import styles from '@native/support/suite/styles';

const Preloader: React.FC = ({ children }) => {
    const { loading, loaded, error } = useSelector(state => ({
        loading: state.suite.loading,
        loaded: state.suite.loaded,
        error: state.suite.error,
    }));
    const { init } = useActions({
        init: () => ({ type: SUITE.INIT }),
    });
    const theme = useTheme();
    useEffect(() => {
        if (!loading && !loaded && !error) {
            init();
        }
    }, [init, loaded, loading, error]);

    if (error) {
        return (
            <View>
                <Text>Failed to load Trezor Suite</Text>
                <Text>Ups, something went wrong. Details: {error}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles(theme).safeArea}>
            {!loaded && <Text>Loading</Text>}
            {loaded && children}
        </SafeAreaView>
    );
};

export default Preloader;
