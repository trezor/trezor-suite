/**
 * File corresponding with @suite-components/Preloader
 * Differences:
 * - SafeAreaView wrapper (react-navigation)
 * - No "OnlineStatus" component (@suite-support/OnlineStatus is using "window" object)
 */

import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { View } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { SUITE } from '@suite-actions/constants';
import { H1, P } from '@trezor/components';
import { AppState, Dispatch } from '@suite-types';
import styles from '@suite-support/styles';

const mapStateToProps = (state: AppState) => ({
    loading: state.suite.loading,
    loaded: state.suite.loaded,
    error: state.suite.error,
});

type Props = ReturnType<typeof mapStateToProps> & {
    dispatch: Dispatch;
    children: React.ReactNode;
};

const Preloader = (props: Props) => {
    const { loading, loaded, error, dispatch } = props;
    useEffect(() => {
        if (!loading && !loaded && !error) {
            dispatch({ type: SUITE.INIT });
        }
    }, [dispatch, loaded, loading, error]);

    if (error) {
        return (
            <View>
                <H1>Failed to load Trezor Suite</H1>
                <P>Ups, something went wrong. Details: {error}</P>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {!loaded && <H1>Loading</H1>}
            {loaded && props.children}
        </SafeAreaView>
    );
};

export default connect(mapStateToProps)(Preloader);
