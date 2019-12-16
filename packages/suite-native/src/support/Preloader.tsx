import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { View, SafeAreaView, StyleSheet } from 'react-native';
import { SUITE } from '@suite-actions/constants';
import { H1, P } from '@trezor/components';
import { AppState, Dispatch } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    loaded: state.suite.loaded,
    error: state.suite.error,
});

type Props = ReturnType<typeof mapStateToProps> & {
    dispatch: Dispatch;
    isStatic: boolean;
    children: React.ReactNode;
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'powderblue',
    },
});

const Preloader = (props: Props) => {
    const { loaded, error, dispatch, isStatic } = props;
    useEffect(() => {
        if (!loaded && !isStatic) {
            dispatch({ type: SUITE.INIT });
        }
    }, [dispatch, isStatic, loaded, props.children]);

    if (error) {
        return (
            <View>
                <H1>Failed to load Trezor Suite</H1>
                <P>Ups, something went wrong. Details: {error}</P>
            </View>
        );
    }

    if (isStatic) {
        return <SafeAreaView style={styles.safeArea}>{props.children}</SafeAreaView>;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {!loaded && <H1>Loading</H1>}
            {loaded && props.children}
        </SafeAreaView>
    );
};

export default connect(mapStateToProps)(Preloader);
