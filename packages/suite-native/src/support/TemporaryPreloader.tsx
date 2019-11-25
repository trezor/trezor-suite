import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { View, Text, StyleSheet } from 'react-native';
import { SUITE } from '@suite-actions/constants';
// import { H1, P } from '@trezor/components';
import { AppState, Dispatch } from '@suite-types';

interface Props {
    loaded: AppState['suite']['loaded'];
    error: AppState['suite']['error'];
    dispatch: Dispatch;
    isStatic: boolean;
}

const Preloader: React.FunctionComponent<Props> = props => {
    const { loaded, error, dispatch, isStatic } = props;
    useEffect(() => {
        if (!loaded && !isStatic) {
            dispatch({ type: SUITE.INIT });
        }
    }, [dispatch, isStatic, loaded, props.children]);

    if (error) {
        return (
            <View>
                <Text>Error {error}</Text>
                {/* <H1>Failed to load Trezor Suite</H1>
                <P>Ups, something went wrong. Details: {error}</P> */}
            </View>
        );
    }

    if (isStatic) return <View>{props.children}</View>;

    return (
        <View style={{ flex: 1 }}>
            {/* {!loaded && <H1>Loading</H1>} */}
            {!loaded && <Text>Loading</Text>}
            {loaded && props.children}
        </View>
    );
};

const mapStateToProps = (state: AppState) => ({
    loaded: state.suite.loaded,
    error: state.suite.error,
});

export default connect(mapStateToProps)(Preloader);
