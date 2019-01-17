import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import ModalActions from 'actions/ModalActions';
import ReceiveActions from 'actions/ReceiveActions';

import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';

import Modal from './index';

export type Props = StateProps & DispatchProps;

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
    modal: state.modal,
    accounts: state.accounts,
    devices: state.devices,
    connect: state.connect,
    selectedAccount: state.selectedAccount,
    sendFormEthereum: state.sendFormEthereum,
    sendFormRipple: state.sendFormRipple,
    receive: state.receive,
    localStorage: state.localStorage,
    wallet: state.wallet,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    modalActions: bindActionCreators(ModalActions, dispatch),
    receiveActions: bindActionCreators(ReceiveActions, dispatch),
});

// export default connect(mapStateToProps, mapDispatchToProps)(Modal);
export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(Modal),
);