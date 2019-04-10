/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as ImportAccountActions from 'actions/ImportAccountActions';

import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { TrezorDevice, Config, State, Dispatch } from 'flowtype';
import ImportView from './index';

export type StateProps = {
    device: ?TrezorDevice,
    importAccount: $ElementType<State, 'importAccount'>,
    config: Config,
    children?: React.Node,
};

type DispatchProps = {
    importAddress: typeof ImportAccountActions.importAddress,
};

type OwnProps = {};

export type Props = StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (
    state: State
): StateProps => ({
    config: state.localStorage.config,
    device: state.wallet.selectedDevice,
    importAccount: state.importAccount,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (
    dispatch: Dispatch
): DispatchProps => ({
    importAddress: bindActionCreators(ImportAccountActions.importAddress, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ImportView);
