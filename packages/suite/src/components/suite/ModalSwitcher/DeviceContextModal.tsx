import React from 'react';
import { useIntl } from 'react-intl';

import messages from 'src/support/messages';
import TrezorConnect, { UI } from '@trezor/connect';
import { MODAL } from 'src/actions/suite/constants';
import { useSelector } from 'src/hooks/suite';
import {
    Pin,
    PinInvalid,
    Passphrase,
    PassphraseSource,
    PassphraseOnDevice,
    ConfirmActionModal,
    ConfirmFingerprintModal,
    Word,
    WordAdvanced,
    ReviewTransaction,
    ConfirmAddress,
    ConfirmXpub,
} from 'src/components/suite/modals';
import type { ReduxModalProps } from './types';

/** Modals requested by Device from `trezor-connect` */
export const DeviceContextModal = ({
    windowType,
    renderer,
    data,
}: ReduxModalProps<typeof MODAL.CONTEXT_DEVICE>) => {
    const device = useSelector(state => state.suite.device);
    const intl = useIntl();

    if (!device) return null;

    const abort = () => TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));

    switch (windowType) {
        // T1B1 firmware
        case UI.REQUEST_PIN:
            return <Pin device={device} renderer={renderer} />;
        // T1B1 firmware
        case UI.INVALID_PIN:
            return <PinInvalid device={device} renderer={renderer} />;

        // Passphrase on host
        case UI.REQUEST_PASSPHRASE:
            return <Passphrase device={device} />;

        case 'WordRequestType_Plain':
            return <Word renderer={renderer} />;
        case 'WordRequestType_Matrix6':
            return <WordAdvanced count={6} renderer={renderer} />;
        case 'WordRequestType_Matrix9':
            return <WordAdvanced count={9} renderer={renderer} />;
        case 'ButtonRequest_PassphraseType':
            return <PassphraseSource device={device} />;
        // T2T1 firmware
        case UI.REQUEST_PASSPHRASE_ON_DEVICE:
        case 'ButtonRequest_PassphraseEntry':
            return <PassphraseOnDevice device={device} />;
        case 'ButtonRequest_ConfirmOutput':
        case 'ButtonRequest_FeeOverThreshold':
        case 'ButtonRequest_SignTx': {
            return <ReviewTransaction type="sign-transaction" />;
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
                <ConfirmAddress
                    value={data.address}
                    addressPath={data.serializedPath}
                    onCancel={abort}
                />
            ) : null;
        case 'ButtonRequest_PublicKey':
            return <ConfirmXpub onCancel={abort} />;
        default:
            return null;
    }
};
