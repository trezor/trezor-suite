import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { State, Dispatch } from '@suite/types';
import { Loader } from '@trezor/components';
import { View, StyleSheet } from 'react-native';
import { SUITE } from '@suite/actions/constants';
import SuiteWrapper from '../views';

interface Props {
    loaded: State['suite']['loaded'];
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
    const { loaded, dispatch } = props;
    useEffect(() => {
        if (!loaded) {
            dispatch({ type: SUITE.INIT });
        }
    }, [dispatch, loaded]);
    return !loaded ? (
        <View style={styles.wrapper}>
            <Loader text="Loading" size={100} />
        </View>
    ) : (
        <SuiteWrapper>{props.children}</SuiteWrapper>
    );
};

const mapStateToProps = (state: State) => ({
    loaded: state.suite.loaded,
});

export default connect(mapStateToProps)(Preloader);
