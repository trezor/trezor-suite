import { useIntl } from 'react-intl';

import TrezorConnect, { UI } from '@trezor/connect';
import { selectDevice } from '@suite-common/wallet-core';
import messages from 'src/support/messages';
import { MODAL } from 'src/actions/suite/constants';
import { useSelector } from 'src/hooks/suite';
import {
    PinModal,
    PinInvalidModal,
    PassphraseModal,
    PassphraseSourceModal,
    PassphraseOnDeviceModal,
    ConfirmActionModal,
    ConfirmFingerprintModal,
    WordModal,
    WordAdvancedModal,
    TransactionReviewModal,
    ConfirmAddressModal,
    ConfirmXpubModal,
} from 'src/components/suite/modals';
import type { ReduxModalProps } from '../ReduxModal';

/** Modals requested by Device from `trezor-connect` */
export const DeviceContextModal = ({
    windowType,
    renderer,
    data,
}: ReduxModalProps<typeof MODAL.CONTEXT_DEVICE>) => {
    const device = useSelector(selectDevice);
    const intl = useIntl();

    if (!device) return null;

    const abort = () => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));

    switch (windowType) {
        // T1B1 firmware
        case UI.REQUEST_PIN:
            return <PinModal device={device} renderer={renderer} />;
        // T1B1 firmware
        case UI.INVALID_PIN:
            return <PinInvalidModal device={device} renderer={renderer} />;

        // Passphrase on host
        case UI.REQUEST_PASSPHRASE:
            return <PassphraseModal device={device} />;

        case 'WordRequestType_Plain':
            return <WordModal renderer={renderer} />;
        case 'WordRequestType_Matrix6':
            return <WordAdvancedModal count={6} renderer={renderer} />;
        case 'WordRequestType_Matrix9':
            return <WordAdvancedModal count={9} renderer={renderer} />;
        case 'ButtonRequest_PassphraseType':
            return <PassphraseSourceModal device={device} />;
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
            return <ConfirmActionModal device={device} renderer={renderer} />;
        }
        case 'ButtonRequest_FirmwareCheck':
            return <ConfirmFingerprintModal device={device} renderer={renderer} />;
        // Generic Button requests
        // todo: consider fallback (if windowType.contains('ButtonRequest')). but add also possibility to blacklist some buttonRequests
        case 'ButtonRequest_Warning':
        case 'ButtonRequest_Success':
        case 'ButtonRequest_RecoveryHomepage':
        case 'ButtonRequest_MnemonicWordCount':
        case 'ButtonRequest_MnemonicInput':
        case 'ButtonRequest_ProtectCall':
        case 'ButtonRequest_ResetDevice': // dispatched on BackupDevice call for T2T1, weird but true
        case 'ButtonRequest_ConfirmWord': // dispatched on BackupDevice call for T1B1
        case 'ButtonRequest_WipeDevice':
        case 'ButtonRequest_UnknownDerivationPath':
        case 'ButtonRequest_FirmwareUpdate':
        case 'ButtonRequest_PinEntry':
            return <ConfirmActionModal device={device} renderer={renderer} />;
        case 'ButtonRequest_Address':
            return data ? (
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
