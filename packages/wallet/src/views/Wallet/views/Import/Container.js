/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as ImportAccountActions from 'actions/ImportAccountActions';
import type { State, Dispatch, TrezorDevice, Config } from 'flowtype';
import ImportView from './index';

type OwnProps = {|
    children?: React.Node,
|};
export type StateProps = {|
    device: ?TrezorDevice,
    config: Config,
    importAccount: $ElementType<State, 'importAccount'>,
|};

type DispatchProps = {|
    importAddress: typeof ImportAccountActions.importAddress,
|};

export type Props = {| ...OwnProps, ...StateProps, ...DispatchProps |};

const mapStateToProps = (state: State): StateProps => ({
    config: state.localStorage.config,
    device: state.wallet.selectedDevice,
    importAccount: state.importAccount,
});

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
    importAddress: bindActionCreators(ImportAccountActions.importAddress, dispatch),
});

export default connect<Props, OwnProps, StateProps, DispatchProps, State, Dispatch>(
    mapStateToProps,
    mapDispatchToProps
)(ImportView);
