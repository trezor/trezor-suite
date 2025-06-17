import { useIntl } from 'react-intl';

import { selectSelectedDevice } from '@suite-common/wallet-core';
import TrezorConnect, { UI } from '@trezor/connect';

import { MODAL } from 'src/actions/suite/constants';
import {
    ConfirmActionModal,
    ConfirmAddressModal,
    ConfirmFingerprintModal,
    ConfirmXpubModal,
    PassphraseOnDeviceModal,
    PinModal,
    TransactionReviewModal,
} from 'src/components/suite/modals';
import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import messages from 'src/support/messages';

import type { ReduxModalProps } from '../ReduxModal';
import { SignMessageModal } from './SignMessageModal';

/** Modals requested by Device from `trezor-connect` */
export const DeviceContextModal = ({
    windowType,
    data,
}: ReduxModalProps<typeof MODAL.CONTEXT_DEVICE>) => {
    const device = useSelector(selectSelectedDevice);
    const intl = useIntl();
    const selectedAccount = useSelector(selectSelectedAccount);

    if (!device) return null;
    const abort = () => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));

    switch (windowType) {
        // T1B1 firmware
        case UI.REQUEST_PIN:
        case UI.INVALID_PIN:
            return <PinModal device={device} />;
        // T2T1 firmware
        case UI.REQUEST_PASSPHRASE_ON_DEVICE:
        case 'ButtonRequest_PassphraseEntry':
            return <PassphraseOnDeviceModal device={device} />;
        case 'ButtonRequest_ConfirmOutput':
        case 'ButtonRequest_FeeOverThreshold':
        case 'ButtonRequest_SignTx': {
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
        case 'ButtonRequest_Address':
            return data?.type === 'address' ? (
                <ConfirmAddressModal
                    value={data.address}
                    addressPath={data.serializedPath}
                    onCancel={abort}
                />
            ) : null;
        case 'ButtonRequest_PublicKey':
            return <ConfirmXpubModal onCancel={abort} />;
        default:
            return null;
    }
};
