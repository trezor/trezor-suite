/* @flow */
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { showAddress } from 'actions/ReceiveActions';
import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';
import Receive from './index';

type OwnProps = { }

type StateProps = {
    selectedAccount: $ElementType<State, 'selectedAccount'>,
    receive: $ElementType<State, 'receive'>,
    modal: $ElementType<State, 'modal'>,
    wallet: $ElementType<State, 'wallet'>,
}

type DispatchProps = {
    showAddress: typeof showAddress
};

export type Props = StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    selectedAccount: state.selectedAccount,
    receive: state.receive,
    modal: state.modal,
    wallet: state.wallet,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    showAddress: bindActionCreators(showAddress, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Receive);