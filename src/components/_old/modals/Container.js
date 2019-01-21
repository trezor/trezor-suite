import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import ModalActions from 'actions/ModalActions';
import ReceiveActions from 'actions/ReceiveActions';

import Modal from './index';

const mapStateToProps = state => ({
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

const mapDispatchToProps = dispatch => ({
    modalActions: bindActionCreators(ModalActions, dispatch),
    receiveActions: bindActionCreators(ReceiveActions, dispatch),
});

// export default connect(mapStateToProps, mapDispatchToProps)(Modal);
export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(Modal),
);