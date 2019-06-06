import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { State, Dispatch } from '@suite/types';
import { Loader } from '@trezor/components';
import { View, StyleSheet } from 'react-native';
import { SUITE } from '@suite/actions/constants';
import VersionPage from '@suite/views/version';
import Layout from '@suite/components/Layout';
import SuiteWrapper from '../views';

interface Props {
    loaded: State['suite']['loaded'];
    dispatch: Dispatch;
    router: State['router'];
}

const styles = StyleSheet.create({
    wrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
});

const Preloader: React.FunctionComponent<Props> = props => {
    const { loaded, dispatch, router } = props;
    useEffect(() => {
        if (router.pathname !== '/version' || !loaded) {
            dispatch({ type: SUITE.INIT });
        }
    }, [dispatch, loaded, router.pathname]);

    if (router.pathname === '/version') {
        return (
            <Layout isLanding>
                <VersionPage />
            </Layout>
        );
    }

    if (!loaded) {
        return (
            <View style={styles.wrapper}>
                <Loader text="Loading" size={100} strokeWidth={1} />
            </View>
        );
    }

    return <SuiteWrapper>{props.children}</SuiteWrapper>;
};

const mapStateToProps = (state: State) => ({
    loaded: state.suite.loaded,
    router: state.router,
});

export default connect(mapStateToProps)(Preloader);
