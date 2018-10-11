/* @flow */

import * as React from 'react';
import { CSSTransition } from 'react-transition-group';

import styled from 'styled-components';
import colors from 'config/colors';

import { UI } from 'trezor-connect';
import * as MODAL from 'actions/constants/modal';
import * as RECEIVE from 'actions/constants/receive';
import * as CONNECT from 'actions/constants/TrezorConnect';

// device context
import Pin from 'components/modals/pin/Pin';
import InvalidPin from 'components/modals/pin/Invalid';
import Passphrase from 'components/modals/passphrase/Passphrase';
import PassphraseType from 'components/modals/passphrase/Type';
import ConfirmSignTx from 'components/modals/confirm/SignTx';
import ConfirmUnverifiedAddress from 'components/modals/confirm/UnverifiedAddress';
import ForgetDevice from 'components/modals/device/Forget';
import RememberDevice from 'components/modals/device/Remember';
import DuplicateDevice from 'components/modals/device/Duplicate';
import WalletType from 'components/modals/device/WalletType';

// external context
import NemWallet from 'components/modals/external/NemWallet';

import type { Props } from './Container';

const Fade = (props: { children: React.Node}) => (
    <CSSTransition
        {...props}
        timeout={1000}
        classNames="fade"
    >{ props.children }
    </CSSTransition>
);

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
`;

const ModalWindow = styled.div`
    margin: auto;
    position: relative;
    border-radius: 4px;
    background-color: ${colors.WHITE};
    text-align: center;
`;

// get modal component with device context
const getDeviceContextModal = (props: Props) => {
    const { modal, modalActions } = props;
    if (modal.context !== MODAL.CONTEXT_DEVICE) return null;

    switch (modal.windowType) {
        case UI.REQUEST_PIN:
            return (
                <Pin
                    device={modal.device}
                    onPinSubmit={modalActions.onPinSubmit}
                />);

        case UI.INVALID_PIN:
            return <InvalidPin device={modal.device} />;

        case UI.REQUEST_PASSPHRASE:
            return (
                <Passphrase
                    device={modal.device}
                    selectedDevice={props.wallet.selectedDevice}
                    onPassphraseSubmit={modalActions.onPassphraseSubmit}
                />);

        case 'ButtonRequest_PassphraseType':
            return <PassphraseType device={modal.device} />;

        case 'ButtonRequest_SignTx':
            return <ConfirmSignTx device={modal.device} sendForm={props.sendForm} />;

        case RECEIVE.REQUEST_UNVERIFIED:
            return (
                <ConfirmUnverifiedAddress
                    device={modal.device}
                    account={props.selectedAccount.account}
                    onCancel={modalActions.onCancel}
                    showAddress={props.receiveActions.showAddress}
                    showUnverifiedAddress={props.receiveActions.showUnverifiedAddress}
                />);

        case CONNECT.REMEMBER_REQUEST:
            return (
                <RememberDevice
                    device={modal.device}
                    instances={modal.instances}
                    onRememberDevice={modalActions.onRememberDevice}
                    onForgetDevice={modalActions.onForgetDevice}
                />);

        case CONNECT.FORGET_REQUEST:
            return (
                <ForgetDevice
                    device={modal.device}
                    onForgetSingleDevice={modalActions.onForgetSingleDevice}
                    onCancel={modalActions.onCancel}
                />);

        case CONNECT.TRY_TO_DUPLICATE:
            return (
                <DuplicateDevice
                    device={modal.device}
                    devices={props.devices}
                    onDuplicateDevice={modalActions.onDuplicateDevice}
                    onCancel={modalActions.onCancel}
                />);

        case CONNECT.REQUEST_WALLET_TYPE:
            return (
                <WalletType
                    device={modal.device}
                    onWalletTypeRequest={modalActions.onWalletTypeRequest}
                    onCancel={modalActions.onCancel}
                />);

        default:
            return null;
    }
};

// get modal component with external context
const getExternalContextModal = (props: Props) => {
    const { modal, modalActions } = props;
    if (modal.context !== MODAL.CONTEXT_EXTERNAL_WALLET) return null;

    switch (modal.windowType) {
        case 'xem':
            return (<NemWallet onCancel={modalActions.onCancel} />);
        default:
            return null;
    }
};

// modal container component
const Modal = (props: Props) => {
    const { modal } = props;
    if (modal.context === MODAL.CONTEXT_NONE) return null;

    let component = null;
    switch (modal.context) {
        case MODAL.CONTEXT_DEVICE:
            component = getDeviceContextModal(props);
            break;
        case MODAL.CONTEXT_EXTERNAL_WALLET:
            component = getExternalContextModal(props);
            break;
        default:
            break;
    }

    return (
        <Fade key="modal-fade">
            <ModalContainer>
                <ModalWindow>
                    { component }
                </ModalWindow>
            </ModalContainer>
        </Fade>
    );
};

export default Modal;
