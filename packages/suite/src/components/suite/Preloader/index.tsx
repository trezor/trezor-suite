import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { Loader, P, H1 } from '@trezor/components';
import { View, StyleSheet } from 'react-native';
import { SUITE } from '@suite-actions/constants';
import { isStatic } from '@suite-actions/routerActions';
import { AppState, Dispatch } from '@suite-types/index';
import SuiteWrapper from '@suite-views/index';

interface Props {
    loaded: AppState['suite']['loaded'];
    error: AppState['suite']['error'];
    router: AppState['router'];
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
    const { loaded, error, dispatch, router } = props;
    const isStaticRoute = isStatic(router.pathname);
    console.log('isStaticRoute', isStaticRoute);

    useEffect(() => {
        if (!loaded && !isStaticRoute) {
            dispatch({ type: SUITE.INIT });
        }
    }, [dispatch, isStaticRoute, loaded]);

    if (isStaticRoute) {
        return <SuiteWrapper>{props.children}</SuiteWrapper>;
    }

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

const mapStateToProps = (state: AppState) => ({
    loaded: state.suite.loaded,
    error: state.suite.error,
    router: state.router,
});

export default connect(mapStateToProps)(Preloader);
