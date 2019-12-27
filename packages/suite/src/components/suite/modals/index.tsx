import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import FocusLock from 'react-focus-lock';

import { UI } from 'trezor-connect';
import { Modal as ModalComponent, Button } from '@trezor/components';

import * as modalActions from '@suite-actions/modalActions';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import * as receiveActions from '@wallet-actions/receiveActions';
import * as routerActions from '@suite-actions/routerActions';
import { MODAL, SUITE, DEVICE_SETTINGS } from '@suite-actions/constants';
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
import RequestInstance from './RequestInstance';
import RememberDevice from './Remember';
// import DuplicateDevice from 'components/modals/device/Duplicate';
import WalletType from './WalletType';
import AddAccount from './AddAccount';
import QrScanner from './Qr';
import Disconnect from './Disconnect';
import BackgroundGallery from './BackgroundGallery';

const mapStateToProps = (state: AppState) => ({
    modal: state.modal,
    device: state.suite.device,
    devices: state.devices,
    send: state.wallet.send,
    account: state.wallet.selectedAccount.account,
    router: state.router,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    sendFormActions: bindActionCreators(sendFormActions, dispatch),
    modalActions: bindActionCreators(modalActions, dispatch),
    receiveActions: bindActionCreators(receiveActions, dispatch),
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const ExampleAppModal = ({goto}) => (
    <ModalComponent>
        <div>exmaple app modal</div>
        <Button onClick={() => goto('settings-devcie')}>Exit</Button>
    </ModalComponent>
);

const getDeviceContextModal = (props: Props) => {
    // const { modal, modalActions } = props;
    const { modal, device, send, modalActions, account } = props;
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
        case 'ButtonRequest_ResetDevice': // dispatched on BackupDevice call for model T, weird but true
        case 'ButtonRequest_ConfirmWord': // dispatch on BackupDevice call for model One
        case 'ButtonRequest_ConfirmOutput':
        case 'ButtonRequest_WipeDevice':
            // case 'ButtonRequest_FirmwareUpdate': // ? fake UI event, see firmwareActions
            return <ConfirmAction device={device} />;
        case 'ButtonRequest_SignTx': {
            return <ConfirmSignTx device={device} sendForm={send} account={account} />;
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

        case SUITE.REQUEST_DEVICE_INSTANCE:
            return (
                // TODO: DELETE or implement new design once it's ready
                // Used to be triggered from function 'requestDeviceInstance' fired on 'add hidden wallet' btn in 'SwitchDeviceModal'
                <RequestInstance
                    device={modal.device as AcquiredDevice}
                    instance={deviceUtils.getNewInstanceNumber(
                        props.devices,
                        modal.device as AcquiredDevice,
                    )}
                    onCreateInstance={modalActions.onCreateDeviceInstance}
                    onCancel={modalActions.onCancel}
                />
            );
        case SUITE.REQUEST_DISCONNECT_DEVICE:
            return <Disconnect device={device} />;

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
    const { modal, router } = props;

    let component = null;
    switch (modal.context) {
        case MODAL.CONTEXT_NONE:
            component = null;
            break;
        case MODAL.CONTEXT_DEVICE:
            component = getDeviceContextModal(props);
            break;
        case MODAL.CONTEXT_CONFIRMATION:
            component = getConfirmationModal(props);
            break;
        case MODAL.CONTEXT_SCAN_QR:
            component = getQrModal(props);
            break;
        default:
            break;
    }

    if (!component && router.route && router.route.isModal) {
        switch (router.app) {
            case 'firmware':
                component = <ExampleAppModal goto={props.goto} />;
                break;
            default:
                break;
        }
    }

    if (!component) {
        return null;
    }

    return (
        <ModalComponent
            // if modal has onCancel action set cancelable to true and pass the onCancel action
            cancelable={component && component.props.onCancel}
            onCancel={component ? component.props.onCancel : undefined}
        >
            {component && <FocusLock>{component}</FocusLock>}
        </ModalComponent>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(Modal);
