import { useIntl } from 'react-intl';

import { selectSelectedAccount } from '@suite/account';
import { messages } from '@suite/intl';
import { type MODAL_CONTEXT_DEVICE } from '@suite/modal';
import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { selectSelectedDevice } from '@suite-common/device';
import TrezorConnect, { UI_EVENTS, UI_REQUESTS } from '@trezor/connect';
import { lazyComponentByName } from '@trezor/lazy-loading';

import { useSelector } from '#src/hooks/suite/useSelector';

import type { ReduxModalProps } from '../ReduxModalProps';
// Eager: TransactionReviewModal's mount effect sets state.modal.preserve before CLOSE_UI_WINDOW.
import { TransactionReviewModal } from '../TransactionReviewModal/TransactionReviewModal';
import {
    ConfirmXpubModal,
    ConnectAddressConfirmation,
    ConnectSelectAccount,
} from '../UserContextModal/lazyUserContextModals';

const { LazyComponent: ConfirmActionModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-device" */ './ConfirmActionModal'),
    'ConfirmActionModal',
);
const { LazyComponent: ConfirmFingerprintModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-device" */ './ConfirmFingerprintModal'),
    'ConfirmFingerprintModal',
);
const { LazyComponent: ConfirmPassphraseBeforeAction } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-device" */ './ConfirmPassphraseBeforeAction'),
    'ConfirmPassphraseBeforeAction',
);
const { LazyComponent: PassphraseOnDeviceModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-device" */ './PassphraseOnDeviceModal'),
    'PassphraseOnDeviceModal',
);
const { LazyComponent: PinModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-device" */ './PinModal'),
    'PinModal',
);
const { LazyComponent: SignMessageModal } = lazyComponentByName(
    () => import(/* webpackChunkName: "modals-device" */ './SignMessageModal'),
    'SignMessageModal',
);
/** Modals requested by Device from `trezor-connect` */
export const DeviceContextModal = ({
    windowType,
    data,
}: ReduxModalProps<typeof MODAL_CONTEXT_DEVICE>) => {
    const device = useSelector(selectSelectedDevice);
    const intl = useIntl();
    const selectedAccount = useSelector(selectSelectedAccount);
    const popupCallState = useSelector(state => selectConnectPopupCall(state)?.state);

    if (!device) return null;
    const abort = () => TrezorConnect.cancel({ reason: intl.formatMessage(messages.TR_CANCELLED) });

    switch (windowType) {
        // T1B1 firmware
        case UI_REQUESTS.REQUEST_PIN:
        case UI_EVENTS.PIN_INVALID:
            return <PinModal device={device} />;
        case UI_REQUESTS.REQUEST_PASSPHRASE:
            return <ConfirmPassphraseBeforeAction />;
        // T2T1 firmware
        case UI_EVENTS.PASSPHRASE_ON_DEVICE:
        case 'ButtonRequest_PassphraseEntry':
            return <PassphraseOnDeviceModal device={device} />;
        case 'ButtonRequest_ConfirmOutput':
        case 'ButtonRequest_FeeOverThreshold':
        case 'ButtonRequest_SignTx': {
            if (data?.type === 'message') return <SignMessageModal device={device} {...data} />;

            return <TransactionReviewModal type="sign-transaction" />;
        }
        case 'ButtonRequest_Other': {
            if (data?.type === 'message') return <SignMessageModal device={device} {...data} />;

            return <ConfirmActionModal device={device} />;
        }
        case 'ButtonRequest_FirmwareCheck':
            return <ConfirmFingerprintModal device={device} />;
        // Generic Button requests
        // todo: consider fallback (if windowType.contains('ButtonRequest')). but add also possibility to blacklist some buttonRequests
        case 'ButtonRequest_Warning':
        case 'ButtonRequest_Success':
        case 'ButtonRequest_RecoveryHomepage':
        case 'ButtonRequest_MnemonicWordCount':
        case 'ButtonRequest_MnemonicInput':
        case 'ButtonRequest_ResetDevice': // dispatched on BackupDevice call for T2T1, weird but true
        case 'ButtonRequest_ConfirmWord': // dispatched on BackupDevice call for T1B1
        case 'ButtonRequest_WipeDevice':
        case 'ButtonRequest_UnknownDerivationPath':
        case 'ButtonRequest_FirmwareUpdate':
        case 'ButtonRequest_PinEntry':
            return <ConfirmActionModal device={device} />;
        case 'ButtonRequest_ProtectCall': {
            // This is a special case for T1B1 devices (Stellar).
            // See https://github.com/trezor/trezor-firmware/issues/5120
            if (selectedAccount?.networkType === 'stellar') {
                return <TransactionReviewModal type="sign-transaction" />;
            } else {
                return <ConfirmActionModal device={device} />;
            }
        }
        case 'ButtonRequest_Address': {
            if (data?.type !== 'address') {
                return null;
            }

            if (popupCallState === 'address-confirmation') {
                return <ConnectAddressConfirmation />;
            }
            if (popupCallState === 'select-account') {
                return <ConnectSelectAccount />;
            }

            return <ConfirmActionModal device={device} title="TR_COMPARE_ADDRESS_ON_TREZOR" />;
        }
        case 'ButtonRequest_PublicKey':
            return <ConfirmXpubModal onCancel={abort} />;
        default:
            return null;
    }
};
