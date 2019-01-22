/* @flow */

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import SendFormActions from 'actions/ethereum/SendFormActions';
import { openQrModal } from 'actions/ModalActions';
import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';
import AccountSend from './index';

type OwnProps = {}

export type StateProps = {
    selectedAccount: $ElementType<State, 'selectedAccount'>,
    sendForm: $ElementType<State, 'sendFormEthereum'>,
    wallet: $ElementType<State, 'wallet'>,
    fiat: $ElementType<State, 'fiat'>,
    localStorage: $ElementType<State, 'localStorage'>,
}

export type DispatchProps = {
    sendFormActions: typeof SendFormActions,
    openQrModal: typeof openQrModal,
}

export type Props = StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    selectedAccount: state.selectedAccount,
    sendForm: state.sendFormEthereum,
    wallet: state.wallet,
    fiat: state.fiat,
    localStorage: state.localStorage,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    sendFormActions: bindActionCreators(SendFormActions, dispatch),
    openQrModal: bindActionCreators(openQrModal, dispatch),

});

export default connect(mapStateToProps, mapDispatchToProps)(AccountSend);