import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { View, StyleSheet } from 'react-native';
import Router from '@suite-support/Router';
import { SUITE } from '@suite-actions/constants';
import SuiteWrapper from '@suite-components/SuiteWrapper';
import StaticPageWrapper from '@suite-components/StaticPageWrapper';
import { H1, P } from '@trezor/components';
import { AppState, Dispatch } from '@suite-types';

interface Props {
    loaded: AppState['suite']['loaded'];
    error: AppState['suite']['error'];
    dispatch: Dispatch;
    isStatic: boolean;
}

const styles = StyleSheet.create({
    wrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
});

const Preloader: React.FunctionComponent<Props> = props => {
    const { loaded, error, dispatch, isStatic } = props;
    useEffect(() => {
        if (!loaded) {
            dispatch({ type: SUITE.INIT });
        }
    }, [dispatch, loaded, props.children]);

    if (error) {
        return (
            <View style={styles.wrapper}>
                <H1>Failed to load Trezor Suite</H1>
                <P>Ups, something went wrong. Details: {error}</P>
            </View>
        );
    }

    if (isStatic)
        return (
            <StaticPageWrapper>
                <Router />
                {props.children}
            </StaticPageWrapper>
        );

    return (
        <SuiteWrapper>
            <Router />
            {loaded && props.children}
        </SuiteWrapper>
    );
};

const mapStateToProps = (state: AppState) => ({
    loaded: state.suite.loaded,
    error: state.suite.error,
});

export default connect(mapStateToProps)(Preloader);
