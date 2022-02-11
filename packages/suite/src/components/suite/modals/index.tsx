import * as React from 'react';
import FocusLock from 'react-focus-lock';
import { UI } from 'trezor-connect';

import * as allModalActions from '@suite-actions/modalActions';
import * as routerActions from '@suite-actions/routerActions';
import { MODAL } from '@suite-actions/constants';
import { useSelector, useActions } from '@suite-hooks';

import Pin from './Pin';
import PinInvalid from './PinInvalid';
import PinMismatch from './PinMismatch';
import Passphrase from './Passphrase';
import PassphraseSource from './PassphraseSource';
import PassphraseOnDevice from './PassphraseOnDevice';
import PassphraseDuplicate from './PassphraseDuplicate';
import ConfirmAction from './confirm/Action';
import ConfirmFingerPrint from './confirm/Fingerprint';
import CoinmarketBuyTerms from './confirm/CoinmarketBuyTerms';
import CoinmarketSellTerms from './confirm/CoinmarketSellTerms';
import CoinmarketExchangeTerms from './confirm/CoinmarketExchangeTerms';
import CoinmarketExchangeDexTerms from './confirm/CoinmarketExchangeDexTerms';
import CoinmarketLeaveSpend from './confirm/CoinmarketLeaveSpend';
import Word from './Word';
import WordAdvanced from './WordAdvanced';
import ConfirmAddress from './confirm/Address';
import ConfirmXpub from './confirm/Xpub';
import ConfirmNoBackup from './confirm/NoBackup';
import ReviewTransaction from './ReviewTransaction';
import ImportTransaction from './ImportTransaction';
import ConfirmUnverifiedAddress from './confirm/UnverifiedAddress';
import AddAccount from './AddAccount';
import QrScanner from './QrScanner';
import BackgroundGallery from './BackgroundGallery';
import TransactionDetail from './TransactionDetail';
import Log from './Log';
import WipeDevice from './WipeDevice';
import MetadataProvider from './metadata/MetadataProvider';
import AdvancedCoinSettings from './AdvancedCoinSettings';
import AddToken from './AddToken';
import SafetyChecks from './SafetyChecks';
import { DisableTor } from './DisableTor';
import { useGuide } from '@guide-hooks';

import type { AcquiredDevice } from '@suite-types';

const useSharedProps = () => {
    const { isGuideOpen } = useGuide();
    const props = useSelector(state => ({
        modal: state.modal,
        device: state.suite.device,
        devices: state.devices,
        router: state.router,
    }));
    const actions = useActions({
        onCancel: allModalActions.onCancel,
        onPinCancel: allModalActions.onPinCancel,
        onReceiveConfirmation: allModalActions.onReceiveConfirmation,
        goto: routerActions.goto,
    });
    return {
        ...props,
        ...actions,
        isGuideOpen,
    };
};

type SharedProps = ReturnType<typeof useSharedProps>;

// Modals requested byt Device from `trezor-connect`
const getDeviceContextModal = ({ modal, device, onPinCancel }: SharedProps) => {
    if (modal.context !== MODAL.CONTEXT_DEVICE || !device) return null;

    switch (modal.windowType) {
        // T1 firmware
        case UI.REQUEST_PIN:
            return <Pin device={device} onCancel={onPinCancel} />;
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
        case 'ButtonRequest_ConfirmOutput':
        case 'ButtonRequest_SignTx': {
            return <ReviewTransaction type="sign-transaction" />;
        }
        // firmware bug https://github.com/trezor/trezor-firmware/issues/35
        // ugly hack to make Cardano review modal work
        // root cause of this bug is wrong button request ButtonRequest_Other from CardanoSignTx - should be ButtonRequest_SignTx
        case 'ButtonRequest_Other': {
            if (device.processMode === 'sign-tx') {
                return <ReviewTransaction type="sign-transaction" />;
            }
            return <ConfirmAction device={device} />;
        }
        case 'ButtonRequest_FirmwareCheck':
            return <ConfirmFingerPrint device={device} />;
        // Generic Button requests
        // todo: consider fallback (if windowType.contains('ButtonRequest')). but add also possibility to blacklist some buttonRequests
        case 'ButtonRequest_Warning':
        case 'ButtonRequest_Success':
        case 'ButtonRequest_RecoveryHomepage':
        case 'ButtonRequest_MnemonicWordCount':
        case 'ButtonRequest_MnemonicInput':
        case 'ButtonRequest_ProtectCall':
        case 'ButtonRequest_ResetDevice': // dispatched on BackupDevice call for model T, weird but true
        case 'ButtonRequest_ConfirmWord': // dispatched on BackupDevice call for model One
        case 'ButtonRequest_WipeDevice':
        case 'ButtonRequest_UnknownDerivationPath':
        case 'ButtonRequest_FirmwareUpdate':
        case 'ButtonRequest_PinEntry':
            return <ConfirmAction device={device} />;
        default:
            return null;
    }
};

// Modals requested from `trezor-connect`
const getDeviceConfirmationModal = ({ modal, onReceiveConfirmation, goto }: SharedProps) => {
    if (modal.context !== MODAL.CONTEXT_DEVICE_CONFIRMATION) return null;

    switch (modal.windowType) {
        case 'no-backup':
            return (
                <ConfirmNoBackup
                    onReceiveConfirmation={onReceiveConfirmation}
                    onCreateBackup={() => goto('settings-device')}
                />
            );
        default:
            return null;
    }
};

// Modals opened as result of user action
const getUserContextModal = ({ modal, onCancel }: SharedProps) => {
    if (modal.context !== MODAL.CONTEXT_USER) return null;

    const { payload } = modal;

    switch (payload.type) {
        case 'add-account':
            return (
                <AddAccount
                    device={payload.device as AcquiredDevice}
                    symbol={payload.symbol}
                    noRedirect={payload.noRedirect}
                    onCancel={onCancel}
                />
            );
        case 'unverified-address':
            return <ConfirmUnverifiedAddress {...payload} onCancel={onCancel} />;
        case 'address':
            return (
                <ConfirmAddress {...payload} onCancel={payload.cancelable ? onCancel : undefined} />
            );
        case 'xpub':
            return <ConfirmXpub {...payload} onCancel={onCancel} />;
        case 'device-background-gallery':
            return (
                <BackgroundGallery device={payload.device as AcquiredDevice} onCancel={onCancel} />
            );
        case 'wipe-device':
            return <WipeDevice onCancel={onCancel} />;
        case 'qr-reader':
            return (
                <QrScanner
                    decision={payload.decision}
                    allowPaste={payload.allowPaste}
                    onCancel={onCancel}
                />
            );
        case 'transaction-detail':
            return <TransactionDetail {...payload} onCancel={onCancel} />;
        case 'passphrase-duplicate':
            return <PassphraseDuplicate device={payload.device} duplicate={payload.duplicate} />;
        case 'review-transaction':
            return <ReviewTransaction {...payload} />;
        case 'coinmarket-leave-spend':
            return <CoinmarketLeaveSpend {...payload} onCancel={onCancel} />;
        case 'coinmarket-buy-terms':
            return (
                <CoinmarketBuyTerms
                    provider={payload.provider}
                    onCancel={onCancel}
                    decision={payload.decision}
                />
            );
        case 'coinmarket-sell-terms':
            return (
                <CoinmarketSellTerms
                    provider={payload.provider}
                    onCancel={onCancel}
                    decision={payload.decision}
                />
            );
        case 'coinmarket-exchange-terms':
            return (
                <CoinmarketExchangeTerms
                    provider={payload.provider}
                    onCancel={onCancel}
                    decision={payload.decision}
                />
            );
        case 'coinmarket-exchange-dex-terms':
            return (
                <CoinmarketExchangeDexTerms
                    provider={payload.provider}
                    onCancel={onCancel}
                    decision={payload.decision}
                />
            );
        case 'import-transaction':
            return <ImportTransaction {...payload} onCancel={onCancel} />;
        case 'pin-mismatch':
            return <PinMismatch />;
        case 'log':
            return <Log onCancel={onCancel} />;
        case 'metadata-provider':
            return <MetadataProvider onCancel={onCancel} decision={payload.decision} />;
        case 'advanced-coin-settings':
            return <AdvancedCoinSettings {...payload} onCancel={onCancel} />;
        case 'add-token':
            return <AddToken {...payload} onCancel={onCancel} />;
        case 'safety-checks':
            return <SafetyChecks onCancel={onCancel} />;
        case 'disable-tor':
            return <DisableTor decision={payload.decision} onCancel={onCancel} />;
        default:
            return null;
    }
};

const getModal = (props: SharedProps) => {
    switch (props.modal.context) {
        case MODAL.CONTEXT_DEVICE:
            return getDeviceContextModal(props);
        case MODAL.CONTEXT_DEVICE_CONFIRMATION:
            return getDeviceConfirmationModal(props);
        case MODAL.CONTEXT_USER:
            return getUserContextModal(props);
        default:
            return null;
    }
};

// Action modal container component
export const Modals = () => {
    const props = useSharedProps();
    const modalComponent = getModal(props);
    return modalComponent ? (
        <FocusLock disabled={props.isGuideOpen} autoFocus={false}>
            {modalComponent}
        </FocusLock>
    ) : null;
};

export const RawModals = () => {
    const props = useSharedProps();
    const modalComponent = getModal(props);
    return modalComponent
        ? React.cloneElement(modalComponent, {
              noBackground: true,
              showHeaderBorder: false,
              noPadding: true,
              cancelable: false,
          })
        : null;
};
