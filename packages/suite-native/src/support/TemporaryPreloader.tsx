import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { View, StyleSheet } from 'react-native';
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

    if (isStatic) return <View>{props.children}</View>;

    return (
        <View style={{ flex: 1 }}>
            {!loaded && <H1>Loading</H1>}
            {loaded && props.children}
        </View>
    );
};

export default connect(mapStateToProps)(Preloader);
