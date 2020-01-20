import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import FocusLock from 'react-focus-lock';

import { UI } from 'trezor-connect';
import { Modal as ModalComponent } from '@trezor/components';

import * as modalActions from '@suite-actions/modalActions';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import * as receiveActions from '@wallet-actions/receiveActions';
import * as routerActions from '@suite-actions/routerActions';
import { MODAL } from '@suite-actions/constants';
import { DEVICE_SETTINGS } from '@settings-actions/constants';
import { ACCOUNT, RECEIVE } from '@wallet-actions/constants';
import { AppState, Dispatch, AcquiredDevice } from '@suite-types';

import Pin from './Pin';
import PinInvalid from './PinInvalid';
import Passphrase from './Passphrase';
import PassphraseSource from './PassphraseSource';
import PassphraseOnDevice from './PassphraseOnDevice';
import ConfirmAction from './confirm/Action';
import Word from './Word';
// import ConfirmAddress from './confirm/Address';
import ConfirmNoBackup from './confirm/NoBackup';
import ConfirmSignTx from './confirm/SignTx';
import ConfirmUnverifiedAddress from './confirm/UnverifiedAddress';
import AddAccount from './AddAccount';
import QrScanner from './Qr';
import BackgroundGallery from './BackgroundGallery';

const mapStateToProps = (state: AppState) => ({
    modal: state.modal,
    device: state.suite.device,
    devices: state.devices,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    sendFormActions: bindActionCreators(sendFormActions, dispatch),
    modalActions: bindActionCreators(modalActions, dispatch),
    receiveActions: bindActionCreators(receiveActions, dispatch),
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> & {
        background?: boolean;
    };

const getDeviceContextModal = (props: Props) => {
    const { modal, device, modalActions } = props;
    if (modal.context !== MODAL.CONTEXT_DEVICE || !device) return null;

    switch (modal.windowType) {
        // T1 firmware
        case UI.REQUEST_PIN:
            return <Pin device={device} />;
        // T1 firmware
        case UI.INVALID_PIN:
            return <PinInvalid device={device} />;

        // Passphrase on host
        case UI.REQUEST_PASSPHRASE:
            return <Passphrase device={device} />;

        case 'WordRequestType_Plain':
            return <Word />;

        // used in TT legacy firmware
        // TT legacy firmware
        case 'ButtonRequest_PassphraseType':
            return <PassphraseSource device={device} />;
        // TT firmware
        case UI.REQUEST_PASSPHRASE_ON_DEVICE:
            return <PassphraseOnDevice device={device} />;

        // Button requests
        case 'ButtonRequest_ProtectCall':
        case 'ButtonRequest_Other':
        case 'ButtonRequest_ResetDevice': // dispatched on BackupDevice call for model T, weird but true
        case 'ButtonRequest_ConfirmWord': // dispatch on BackupDevice call for model One
        case 'ButtonRequest_ConfirmOutput':
        case 'ButtonRequest_WipeDevice':
            // case 'ButtonRequest_FirmwareUpdate': // ? fake UI event, see firmwareActions
            return <ConfirmAction device={device} />;
        case 'ButtonRequest_SignTx': {
            return <ConfirmSignTx device={device} />;
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

        case ACCOUNT.REQUEST_NEW_ACCOUNT:
            return (
                <AddAccount device={device as AcquiredDevice} onCancel={modalActions.onCancel} />
            );

        case DEVICE_SETTINGS.OPEN_BACKGROUND_GALLERY_MODAL:
            return (
                <BackgroundGallery
                    device={device as AcquiredDevice}
                    onCancel={modalActions.onCancel}
                />
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
                    onCreateBackup={() => goto('settings-device')}
                />
            );
        default:
            return null;
    }
};

const getQrModal = (props: Props) => {
    const { modalActions, sendFormActions, modal } = props;
    if (modal.context !== MODAL.CONTEXT_SCAN_QR) return null;

    return (
        <QrScanner
            onCancel={modalActions.onCancel}
            onScan={parsedUri => {
                sendFormActions.onQrScan(parsedUri, modal.outputId);
            }}
        />
    );
};

// modal container component
const Modal = (props: Props) => {
    const { modal } = props;

    let modalComponent = null;

    switch (modal.context) {
        case MODAL.CONTEXT_NONE:
            modalComponent = null;
            break;
        case MODAL.CONTEXT_DEVICE:
            modalComponent = getDeviceContextModal(props);
            break;
        case MODAL.CONTEXT_CONFIRMATION:
            modalComponent = getConfirmationModal(props);
            break;
        case MODAL.CONTEXT_SCAN_QR:
            modalComponent = getQrModal(props);
            break;
        default:
            break;
    }

    if (!modalComponent) return null;

    const useBackground = typeof props.background === 'boolean' ? props.background : true;
    if (useBackground) {
        return (
            <ModalComponent
                // if modal has onCancel action set cancelable to true and pass the onCancel action
                cancelable={modalComponent.props.onCancel}
                onCancel={modalComponent.props.onCancel}
            >
                <FocusLock>{modalComponent}</FocusLock>
            </ModalComponent>
        );
    }

    return <FocusLock>{modalComponent}</FocusLock>;
};

export default connect(mapStateToProps, mapDispatchToProps)(Modal);
