import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import FocusLock from 'react-focus-lock';

import { UI } from 'trezor-connect';
import { Modal as ModalComponent } from '@trezor/components';

import * as modalActions from '@suite-actions/modalActions';
import * as receiveActions from '@wallet-actions/receiveActions';
import * as routerActions from '@suite-actions/routerActions';
import { MODAL, SUITE } from '@suite-actions/constants';
import { ACCOUNT } from '@wallet-actions/constants';
import * as deviceUtils from '@suite-utils/device';
import { RECEIVE } from '@suite/actions/wallet/constants';
import { AppState, Dispatch, AcquiredDevice } from '@suite-types';

import Pin from './Pin';
import PinInvalid from './PinInvalid';
import Passphrase from './Passphrase';
import PassphraseType from './PassphraseType';
import ConfirmAction from './confirm/Action';
// import ConfirmAddress from './confirm/Address';
import ConfirmNoBackup from './confirm/NoBackup';
import ConfirmSignTx from './confirm/SignTx';
import ConfirmUnverifiedAddress from './confirm/UnverifiedAddress';
import ForgetDevice from './Forget';
import RequestInstance from './RequestInstance';
import RememberDevice from './Remember';
// import DuplicateDevice from 'components/modals/device/Duplicate';
import WalletType from './WalletType';
import AddAccount from './AddAccount';

const mapStateToProps = (state: AppState) => ({
    modal: state.modal,
    device: state.suite.device,
    devices: state.devices,
    wallet: state.wallet,
    // connect: state.connect,
    // localStorage: state.localStorage,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    modalActions: bindActionCreators(modalActions, dispatch),
    receiveActions: bindActionCreators(receiveActions, dispatch),
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const getDeviceContextModal = (props: Props) => {
    // const { modal, modalActions } = props;
    const { modal, device, modalActions } = props;
    if (modal.context !== MODAL.CONTEXT_DEVICE || !device) return null;

    switch (modal.windowType) {
        case SUITE.REQUEST_PASSPHRASE_MODE:
            return (
                <WalletType
                    device={device}
                    onWalletTypeRequest={modalActions.onWalletTypeRequest}
                    onCancel={modalActions.onCancel}
                />
            );

        case UI.REQUEST_PIN:
            return <Pin device={device} onEnterPin={modalActions.onPinSubmit} />;

        case UI.INVALID_PIN:
            return <PinInvalid device={device} />;

        case UI.REQUEST_PASSPHRASE:
            return (
                <Passphrase
                    device={device}
                    shouldShowSingleInput={!!device.state}
                    onEnterPassphrase={modalActions.onPassphraseSubmit}
                />
            );

        case 'ButtonRequest_PassphraseType':
            return <PassphraseType device={device} />;

        case 'ButtonRequest_ProtectCall':
        case 'ButtonRequest_Other':
        case 'ButtonRequest_ConfirmOutput':
            return <ConfirmAction device={device} />;
        case 'ButtonRequest_SignTx': {
            return <ConfirmSignTx device={device} sendForm={null} />;
        }

        case RECEIVE.REQUEST_UNVERIFIED:
            return (
                <ConfirmUnverifiedAddress
                    device={device}
                    addressPath={modal.addressPath}
                    onCancel={modalActions.onCancel}
                    showAddress={props.receiveActions.showAddress}
                    showUnverifiedAddress={props.receiveActions.showUnverifiedAddress}
                />
            );

        case SUITE.REQUEST_REMEMBER_DEVICE:
            return (
                <RememberDevice
                    device={modal.device as AcquiredDevice}
                    onRememberDevice={modalActions.onRememberDevice}
                    onForgetDevice={modalActions.onForgetDevice}
                />
            );

        case SUITE.REQUEST_FORGET_DEVICE:
            return (
                <ForgetDevice
                    device={modal.device as AcquiredDevice}
                    onForgetDevice={modalActions.onForgetDevice}
                    onCancel={modalActions.onCancel}
                />
            );

        case SUITE.REQUEST_DEVICE_INSTANCE:
            return (
                <RequestInstance
                    device={device as AcquiredDevice}
                    instance={deviceUtils.getNewInstanceNumber(
                        props.devices,
                        device as AcquiredDevice,
                    )}
                    onCreateInstance={modalActions.onCreateDeviceInstance}
                    onCancel={modalActions.onCancel}
                />
            );

        case ACCOUNT.REQUEST_NEW_ACCOUNT:
            return (
                <AddAccount device={device as AcquiredDevice} onCancel={modalActions.onCancel} />
            );

        default:
            return null;
    }
};

const getConfirmationModal = (props: Props) => {
    const { modal, modalActions, goto } = props;

    if (modal.context !== MODAL.CONTEXT_CONFIRMATION) return null;

    switch (modal.windowType) {
        case 'no-backup':
            return (
                <ConfirmNoBackup
                    onReceiveConfirmation={modalActions.onReceiveConfirmation}
                    onCreateBackup={() => goto('suite-device-backup')}
                />
            );
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
        case MODAL.CONTEXT_CONFIRMATION:
            component = getConfirmationModal(props);
            break;
        default:
            break;
    }

    return <ModalComponent>{component && <FocusLock>{component}</FocusLock>}</ModalComponent>;
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Modal);
