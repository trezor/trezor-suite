/* @flow */
import { connect } from 'react-redux';
import type { MapStateToProps } from 'react-redux';
import type { State } from 'flowtype';
import Dashboard from './index';

type OwnProps = {};

type StateProps = {
    localStorage: $ElementType<State, 'localStorage'>,
    wallet: $ElementType<State, 'wallet'>,
};

export type Props = StateProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (
    state: State
): StateProps => ({
    localStorage: state.localStorage,
    wallet: state.wallet,
});

export default connect(
    mapStateToProps,
    null
)(Dashboard);
