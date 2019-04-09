/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as AccountsAction from 'actions/AccountsActions';

import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { TrezorDevice, Config, State, Dispatch } from 'flowtype';
import ImportView from './index';

export type StateProps = {
    device: ?TrezorDevice,
    config: Config,
    children?: React.Node,
};

type DispatchProps = {
    importAddress: typeof AccountsAction.importAddress,
};

type OwnProps = {};

export type Props = StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (
    state: State
): StateProps => ({
    config: state.localStorage.config,
    device: state.wallet.selectedDevice,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (
    dispatch: Dispatch
): DispatchProps => ({
    importAddress: bindActionCreators(AccountsAction.importAddress, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ImportView);
