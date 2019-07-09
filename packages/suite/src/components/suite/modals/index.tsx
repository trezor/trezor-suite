import * as React from 'react';
// import { DEVICE } from 'trezor-connect';

import styled from 'styled-components';
import { colors, animations } from '@trezor/components';

import * as MODAL from '@suite-actions/constants/modalConstants';
import * as CONNECT from '@suite-actions/constants/trezorConnectConstants';

// import Pin from 'components/modals/pin/Pin';
// import InvalidPin from 'components/modals/pin/Invalid';
// import Passphrase from 'components/modals/passphrase/Passphrase';
// import PassphraseType from 'components/modals/passphrase/Type';
// import ConfirmAction from 'components/modals/confirm/Action';
// import ConfirmNoBackup from 'components/modals/confirm/NoBackup';
import ForgetDevice from '@suite-components/modals/device/Forget';
import RememberDevice from '@suite-components/modals/device/Remember';
import WalletType from '@suite-components/modals/device/WalletType';
// import DuplicateDevice from 'components/modals/device/Duplicate';

const ModalContainer = styled.div`
    position: fixed;
    z-index: 10000;
    width: 100%;
    height: 100%;
    top: 0px;
    left: 0px;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    padding: 20px;
    animation: ${animations.FADE_IN} 0.3s;
`;

const ModalWindow = styled.div`
    margin: auto;
    position: relative;
    border-radius: 4px;
    background-color: ${colors.WHITE};
    text-align: center;
`;

const getDeviceContextModal = props => {
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
                <RememberDevice
                    device={modal.device}
                    instances={modal.instances}
                    onRememberDevice={modalActions.onRememberDevice}
                    onForgetDevice={modalActions.onForgetDevice}
                />
            );

        case CONNECT.FORGET_REQUEST:
            return (
                <ForgetDevice
                    device={modal.device}
                    onForgetSingleDevice={modalActions.onForgetSingleDevice}
                    onCancel={modalActions.onCancel}
                />
            );

        case CONNECT.TRY_TO_DUPLICATE:
            return (
                <DuplicateDevice
                    device={modal.device}
                    devices={props.devices}
                    onDuplicateDevice={modalActions.onDuplicateDevice}
                    onCancel={modalActions.onCancel}
                />
            );

        case CONNECT.REQUEST_WALLET_TYPE:
            return (
                <WalletType
                    device={modal.device}
                    // onWalletTypeRequest={modalActions.onWalletTypeRequest}
                    onCancel={modalActions.onCancel}
                />
            );

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
const Modal = props => {
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

    return (
        <ModalContainer>
            <ModalWindow>{component}</ModalWindow>
        </ModalContainer>
    );
};

export default Modal;
