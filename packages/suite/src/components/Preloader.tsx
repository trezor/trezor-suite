import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { State, Dispatch } from '@suite/types';
import { INIT } from '@suite/actions/SuiteActions';

interface Props {
    loaded: State['suite']['loaded'];
    storage: State['storage'];
    dispatch: Dispatch;
}

const Preloader: React.FunctionComponent<Props> = props => {
    const { loaded, dispatch } = props;
    useEffect(() => {
        if (!loaded) {
            dispatch({ type: INIT });
            return;
        }
    }, [loaded]);
    // return !ready ? null : props.children;
    // return <>{props.children}</>;
    return <>{props.children}</>;
};

const mapStateToProps = (state: State) => ({
    ready: state.suite.loaded,
});

export default connect(
    (state: State) => ({
        ready: state.suite.loaded,
        storage: state.storage,
    })
)(Preloader);
