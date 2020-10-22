import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import FocusLock from 'react-focus-lock';
import { UI } from 'trezor-connect';

import * as allModalActions from '@suite-actions/modalActions';
import * as routerActions from '@suite-actions/routerActions';
import { MODAL } from '@suite-actions/constants';
import { AppState, Dispatch, AcquiredDevice } from '@suite-types';

import Pin from './Pin';
import PinInvalid from './PinInvalid';
import PinMismatch from './PinMismatch';
import Passphrase from './Passphrase';
import PassphraseSource from './PassphraseSource';
import PassphraseOnDevice from './PassphraseOnDevice';
import PassphraseDuplicate from './PassphraseDuplicate';
import ConfirmAction from './confirm/Action';
import CoinmarketBuyTerms from './confirm/CoinmarketBuyTerms';
import Word from './Word';
import WordAdvanced from './WordAdvanced';
import ConfirmAddress from './confirm/Address';
import ConfirmXpub from './confirm/Xpub/Container';
import ConfirmNoBackup from './confirm/NoBackup';
import ReviewTransaction from './ReviewTransaction/Container';
import ImportTransaction from './ImportTransaction';
import ConfirmUnverifiedAddress from './confirm/UnverifiedAddress';
import AddAccount from './AddAccount/Container';
import QrScanner from './QrScanner';
import BackgroundGallery from './BackgroundGallery';
import TransactionDetail from './TransactionDetail';
import Log from './Log';
import WipeDevice from './WipeDevice';
import DisconnectDevice from './DisconnectDevice';
import MetadataProvider from './metadata/MetadataProvider';
import AdvancedCoinSettings from './AdvancedCoinSettings/Container';

const mapStateToProps = (state: AppState) => ({
    modal: state.modal,
    device: state.suite.device,
    devices: state.devices,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    modalActions: bindActionCreators(allModalActions, dispatch),
    goto: bindActionCreators(routerActions.goto, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> & {
        background?: boolean;
    };

// Modals requested byt Device from `trezor-connect`
const getDeviceContextModal = (props: Props) => {
    const { modal, device } = props;
    if (modal.context !== MODAL.CONTEXT_DEVICE || !device) return null;

    switch (modal.windowType) {
        // T1 firmware
        case UI.REQUEST_PIN:
            return <Pin device={device} onCancel={props.modalActions.onPinCancel} />;
        // T1 firmware
        case UI.INVALID_PIN:
            return <PinInvalid device={device} />;

        // Passphrase on host
        case UI.REQUEST_PASSPHRASE:
            return <Passphrase device={device} />;

        case 'WordRequestType_Plain':
            return <Word />;
        case 'WordRequestType_Matrix6':
            return <WordAdvanced count={6} />;
        case 'WordRequestType_Matrix9':
            return <WordAdvanced count={9} />;
        case 'ButtonRequest_PassphraseType':
            return <PassphraseSource device={device} />;
        // TT firmware
        case UI.REQUEST_PASSPHRASE_ON_DEVICE:
        case 'ButtonRequest_PassphraseEntry':
            return <PassphraseOnDevice device={device} />;
        // Button requests
        // todo: consider fallback (if windowType.contains('ButtonRequest')). but add also possibility to blacklist some buttonRequests
        case 'ButtonRequest_Warning':
        case 'ButtonRequest_Success':
        case 'ButtonRequest_RecoveryHomepage':
        case 'ButtonRequest_MnemonicWordCount':
        case 'ButtonRequest_MnemonicInput':
        case 'ButtonRequest_ProtectCall':
        case 'ButtonRequest_Other':
        case 'ButtonRequest_ResetDevice': // dispatched on BackupDevice call for model T, weird but true
        case 'ButtonRequest_ConfirmWord': // dispatched on BackupDevice call for model One
        case 'ButtonRequest_WipeDevice':
        case 'ButtonRequest_UnknownDerivationPath':
        case 'ButtonRequest_FirmwareUpdate':
        case 'ButtonRequest_PinEntry':
            return <ConfirmAction device={device} />;
        case 'ButtonRequest_ConfirmOutput':
        case 'ButtonRequest_SignTx':
            return <ReviewTransaction type="sign-transaction" />;
        default:
            return null;
    }
};

// Modals requested from `trezor-connect`
const getDeviceConfirmationModal = (props: Props) => {
    const { modal, modalActions, goto } = props;

    if (modal.context !== MODAL.CONTEXT_DEVICE_CONFIRMATION) return null;

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

// Modals opened as result of user action
const getUserContextModal = (props: Props) => {
    const { modalActions, modal } = props;
    if (modal.context !== MODAL.CONTEXT_USER) return null;

    const { payload } = modal;

    switch (payload.type) {
        case 'add-account':
            return (
                <AddAccount
                    device={payload.device as AcquiredDevice}
                    symbol={payload.symbol}
                    noRedirect={payload.noRedirect}
                    onCancel={modalActions.onCancel}
                />
            );
        case 'unverified-address':
            return <ConfirmUnverifiedAddress {...payload} onCancel={modalActions.onCancel} />;
        case 'address':
            return (
                <ConfirmAddress
                    {...payload}
                    onCancel={payload.cancelable ? modalActions.onCancel : undefined}
                />
            );
        case 'xpub':
            return <ConfirmXpub {...payload} onCancel={modalActions.onCancel} />;
        case 'device-background-gallery':
            return (
                <BackgroundGallery
                    device={payload.device as AcquiredDevice}
                    onCancel={modalActions.onCancel}
                />
            );
        case 'wipe-device':
            return <WipeDevice onCancel={modalActions.onCancel} />;
        case 'qr-reader':
            return <QrScanner decision={payload.decision} onCancel={modalActions.onCancel} />;
        case 'transaction-detail':
            return <TransactionDetail tx={payload.tx} onCancel={modalActions.onCancel} />;
        case 'passphrase-duplicate':
            return <PassphraseDuplicate device={payload.device} duplicate={payload.duplicate} />;
        case 'review-transaction':
            return <ReviewTransaction {...payload} />;
        case 'coinmarket-buy-terms':
            return (
                <CoinmarketBuyTerms
                    provider={payload.provider}
                    onCancel={modalActions.onCancel}
                    decision={payload.decision}
                />
            );
        case 'import-transaction':
            return <ImportTransaction {...payload} onCancel={modalActions.onCancel} />;
        case 'pin-mismatch':
            return <PinMismatch />;
        case 'disconnect-device':
            return <DisconnectDevice />;
        case 'log':
            return <Log onCancel={modalActions.onCancel} />;
        case 'metadata-provider':
            return (
                <MetadataProvider onCancel={modalActions.onCancel} decision={payload.decision} />
            );
        case 'advanced-coin-settings':
            return <AdvancedCoinSettings {...payload} onCancel={modalActions.onCancel} />;
        default:
            return null;
    }
};

// Action modal container component
const Modal = (props: Props) => {
    const { modal } = props;

    let modalComponent;

    switch (modal.context) {
        case MODAL.CONTEXT_DEVICE:
            modalComponent = getDeviceContextModal(props);
            break;
        case MODAL.CONTEXT_DEVICE_CONFIRMATION:
            modalComponent = getDeviceConfirmationModal(props);
            break;
        case MODAL.CONTEXT_USER:
            modalComponent = getUserContextModal(props);
            break;
        default:
            break;
    }

    if (!modalComponent) return null;

    const useBackground = props.background ?? true;
    if (useBackground) {
        return <FocusLock autoFocus={false}>{modalComponent}</FocusLock>;
    }

    return React.cloneElement(modalComponent, {
        noBackground: true,
        showHeaderBorder: false,
        noPadding: true,
        cancelable: false,
    });
};

export default connect(mapStateToProps, mapDispatchToProps)(Modal);
