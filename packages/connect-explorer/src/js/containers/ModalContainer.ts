import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Modal from '../components/modal/Modal';
import * as ModalActions from '../actions/ModalActions';
import { AppState, Dispatch } from '../types';

function mapStateToProps(state: AppState) {
    return {
        modal: state.modal,
    };
}

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        modalActions: bindActionCreators(ModalActions, dispatch),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Modal);
