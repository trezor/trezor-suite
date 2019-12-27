import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { View, StyleSheet } from 'react-native';
import OnlineStatus from '@suite-support/OnlineStatus';
import { SUITE } from '@suite-actions/constants';
import SuiteWrapper from '@suite-components/SuiteWrapper';
import StaticPageWrapper from '@suite-components/StaticPageWrapper';
import { H1, P } from '@trezor/components-v2';
import { AppState, Dispatch } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    loading: state.suite.loading,
    loaded: state.suite.loaded,
    error: state.suite.error,
});

type Props = ReturnType<typeof mapStateToProps> & {
    children: React.ReactNode;
    dispatch: Dispatch;
    isStatic: boolean;
};

const styles = StyleSheet.create({
    wrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
});

const Preloader = (props: Props) => {
    const { loading, loaded, error, dispatch, isModal } = props;
    useEffect(() => {
        if (!loading && !loaded && !error) {
            dispatch({ type: SUITE.INIT });
        }
    }, [dispatch, loaded, loading, error]);

    if (error) {
        return (
            <View style={styles.wrapper}>
                <H1>Failed to load Trezor Suite</H1>
                <P>Ups, something went wrong. Details: {error}</P>
            </View>
        );
    }

    console.log('isModal', isModal);
    if (isModal) {
        return (
            <>
                <OnlineStatus />
                <div>isModal preloader</div>
                {props.children}
            </>
        );
    }

    return (
        <SuiteWrapper>
            <OnlineStatus />
            {props.children}
        </SuiteWrapper>
    );
};

export default connect(mapStateToProps)(Preloader);
