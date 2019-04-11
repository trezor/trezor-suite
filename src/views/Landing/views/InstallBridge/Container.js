/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as RouterActions from 'actions/RouterActions';

import type { State, Dispatch } from 'flowtype';
import InstallBridge from './index';

type OwnProps = {|
    children?: React.Node,
|};
export type StateProps = {|
    transport: $ElementType<$ElementType<State, 'connect'>, 'transport'>,
|};

type DispatchProps = {|
    selectFirstAvailableDevice: typeof RouterActions.selectFirstAvailableDevice,
|};

export type Props = {| ...StateProps, ...DispatchProps, ...OwnProps |};

const mapStateToProps = (state: State): StateProps => ({
    transport: state.connect.transport,
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    selectFirstAvailableDevice: bindActionCreators(
        RouterActions.selectFirstAvailableDevice,
        dispatch
    ),
});

export default connect<Props, OwnProps, StateProps, DispatchProps, State, Dispatch>(
    mapStateToProps,
    mapDispatchToProps
)(InstallBridge);
