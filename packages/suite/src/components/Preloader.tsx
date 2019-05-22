import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { State, Dispatch } from '@suite/types';
import { INIT } from '@suite/actions/SuiteActions';

interface Props {
    loaded: State['suite']['loaded'];
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
    return <>{props.children}</>;
};

const mapStateToProps = (state: State) => ({
    loaded: state.suite.loaded,
});

export default connect(mapStateToProps)(Preloader);
