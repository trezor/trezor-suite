import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { State, Dispatch } from '@suite/types';
import { SUITE } from '@suite/actions/constants';
import Wrapper from './SuiteWrapper';

interface Props {
    loaded: State['suite']['loaded'];
    dispatch: Dispatch;
}

const Preloader: React.FunctionComponent<Props> = props => {
    const { loaded, dispatch } = props;
    useEffect(() => {
        if (!loaded) {
            dispatch({ type: SUITE.INIT });
        }
    }, [dispatch, loaded]);
    return !loaded ? <>Preloader...</> : <Wrapper>{props.children}</Wrapper>;
};

const mapStateToProps = (state: State) => ({
    loaded: state.suite.loaded,
});

export default connect(mapStateToProps)(Preloader);
