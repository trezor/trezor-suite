/* @flow */
import { connect } from 'react-redux';
import type { State, Dispatch } from 'flowtype';
import Dashboard from './index';

type OwnProps = {||};

type StateProps = {|
    localStorage: $ElementType<State, 'localStorage'>,
    wallet: $ElementType<State, 'wallet'>,
|};

export type Props = {| ...StateProps |};

const mapStateToProps = (state: State): StateProps => ({
    localStorage: state.localStorage,
    wallet: state.wallet,
});

export default connect<Props, OwnProps, StateProps, _, State, Dispatch>(mapStateToProps)(Dashboard);
