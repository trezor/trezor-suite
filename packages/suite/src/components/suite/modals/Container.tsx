import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Dispatch } from '@suite-types/index';

import ModalActions from '@suite-actions/ModalActions';

import Modal from './index';

const mapStateToProps = state => ({
    modal: state.modal,
    devices: state.devices,
    connect: state.connect,
    selectedAccount: state.selectedAccount,
    localStorage: state.localStorage,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    modalActions: bindActionCreators(ModalActions, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Modal);
