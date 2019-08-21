import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

// import { DEVICE } from 'trezor-connect';
import { Modal as ModalComponent } from '@trezor/components';

import * as modalActions from '@suite-actions/modalActions';
import * as MODAL from '@suite-actions/constants/modalConstants';
import * as CONNECT from '@suite-actions/constants/trezorConnectConstants';

// import Pin from 'components/modals/pin/Pin';
// import InvalidPin from 'components/modals/pin/Invalid';
// import Passphrase from 'components/modals/passphrase/Passphrase';
// import PassphraseType from 'components/modals/passphrase/Type';
// import ConfirmAction from 'components/modals/confirm/Action';
// import ConfirmNoBackup from 'components/modals/confirm/NoBackup';
import ForgetDeviceModal from '@suite-components/modals/Forget';
import RememberDeviceModal from '@suite-components/modals/Remember';
// import DuplicateDevice from 'components/modals/device/Duplicate';
import { AppState, Dispatch } from '@suite-types';

interface StateProps {
    modal: AppState['modal'];
    devices: AppState['devices'];
}

interface DispatchProps {
    modalActions: typeof modalActions;
}

type Props = StateProps & DispatchProps;

const getDeviceContextModal = (props: Props) => {
    const { modal, modalActions } = props;
    if (modal.context !== MODAL.CONTEXT_DEVICE) return null;

    switch (modal.windowType) {
        // case UI.REQUEST_PIN:
        //     return <Pin device={modal.device} onPinSubmit={modalActions.onPinSubmit} />;

        // case UI.INVALID_PIN:
        //     return <InvalidPin device={modal.device} />;

        // case UI.REQUEST_PASSPHRASE:
        //     return (
        //         <Passphrase
        //             device={modal.device}
        //             selectedDevice={props.wallet.selectedDevice}
        //             onPassphraseSubmit={modalActions.onPassphraseSubmit}
        //         />
        //     );

        // case 'ButtonRequest_PassphraseType':
        //     return <PassphraseType device={modal.device} />;

        // case 'ButtonRequest_ProtectCall':
        //     return <ConfirmAction device={modal.device} />;

        // case 'ButtonRequest_Other':
        // case 'ButtonRequest_ConfirmOutput':
        //     return <ConfirmAction device={modal.device} />;

        case CONNECT.REMEMBER_REQUEST:
            return (
                <RememberDeviceModal
                    device={modal.device}
                    instances={modal.instances}
                    onRememberDevice={modalActions.onRememberDevice}
                    onForgetDevice={modalActions.onForgetDevice}
                />
            );

        case CONNECT.FORGET_REQUEST:
            return (
                <ForgetDeviceModal
                    device={modal.device}
                    onForgetDevice={modalActions.onForgetDevice}
                    onCancel={modalActions.onCancel}
                />
            );

        // case CONNECT.TRY_TO_DUPLICATE:
        //     return (
        //         <DuplicateDevice
        //             device={modal.device}
        //             devices={props.devices}
        //             onDuplicateDevice={modalActions.onDuplicateDevice}
        //             onCancel={modalActions.onCancel}
        //         />
        //     );

        default:
            return null;
    }
};

// const getConfirmationModal = props => {
//     const { modal, modalActions, wallet } = props;

//     if (modal.context !== MODAL.CONTEXT_CONFIRMATION) return null;

//     switch (modal.windowType) {
//         case 'no-backup':
//             return (
//                 <ConfirmNoBackup
//                     device={wallet.selectedDevice}
//                     onReceiveConfirmation={modalActions.onReceiveConfirmation}
//                 />
//             );
//         default:
//             return null;
//     }
// };

// modal container component
const Modal = (props: Props) => {
    const { modal } = props;

    if (modal.context === MODAL.CONTEXT_NONE) return null;

    let component = null;
    switch (modal.context) {
        case MODAL.CONTEXT_DEVICE:
            component = getDeviceContextModal(props);
            break;
        // case MODAL.CONTEXT_CONFIRMATION:
        //     component = getConfirmationModal(props);
        //     break;
        default:
            break;
    }

    return <ModalComponent>{component}</ModalComponent>;
};

const mapStateToProps = (state: AppState) => ({
    modal: state.modal,
    devices: state.devices,
    // connect: state.connect,
    // selectedAccount: state.selectedAccount,
    // localStorage: state.localStorage,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    modalActions: bindActionCreators(modalActions, dispatch),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Modal);
