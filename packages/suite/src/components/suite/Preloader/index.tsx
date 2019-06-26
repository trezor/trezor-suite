import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { Loader, P, H1 } from '@trezor/components';
import { View, StyleSheet } from 'react-native';
import { SUITE } from '@suite-actions/constants';
import { State, Dispatch } from '@suite-types/index';
import SuiteWrapper from '@suite-views/index';

interface Props {
    loaded: State['suite']['loaded'];
    error: State['suite']['error'];
    dispatch: Dispatch;
}

const styles = StyleSheet.create({
    wrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
});

const Preloader: React.FunctionComponent<Props> = props => {
    const { loaded, error, dispatch } = props;
    useEffect(() => {
        if (!loaded) {
            dispatch({ type: SUITE.INIT });
        }
    }, [dispatch, loaded]);
    if (error) {
        return (
            <View style={styles.wrapper}>
                <H1>Failed to load Trezor Suite</H1>
                <P>Ups, something went wrong. Details: {error}</P>
            </View>
        );
    }
    return !loaded ? (
        <View style={styles.wrapper}>
            <Loader text="Loading" size={100} strokeWidth={1} />
        </View>
    ) : (
        <SuiteWrapper>{props.children}</SuiteWrapper>
    );
};

const mapStateToProps = (state: State) => ({
    loaded: state.suite.loaded,
    error: state.suite.error,
});

export default connect(mapStateToProps)(Preloader);
