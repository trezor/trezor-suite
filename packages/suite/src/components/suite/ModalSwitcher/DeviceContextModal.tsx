import React from 'react';
import { UI } from '@trezor/connect';
import { MODAL } from '@suite-actions/constants';
import { useSelector } from '@suite-hooks';
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
} from '@suite-components/modals';
import { selectSelectedAccount } from '@wallet-reducers/selectedAccountReducer';

import type { ReduxModalProps } from './types';

/** Modals requested by Device from `trezor-connect` */
export const DeviceContextModal = ({
    windowType,
    renderer,
    data,
}: ReduxModalProps<typeof MODAL.CONTEXT_DEVICE>) => {
    const device = useSelector(state => state.suite.device);
    const account = useSelector(selectSelectedAccount);
    if (!device) return null;

    switch (windowType) {
        // T1 firmware
        case UI.REQUEST_PIN:
            return <Pin device={device} renderer={renderer} />;
        // T1 firmware
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
        // TT firmware
        case UI.REQUEST_PASSPHRASE_ON_DEVICE:
        case 'ButtonRequest_PassphraseEntry':
            return <PassphraseOnDevice device={device} />;
        case 'ButtonRequest_ConfirmOutput':
        case 'ButtonRequest_FeeOverThreshold':
        case 'ButtonRequest_SignTx': {
            return <ReviewTransaction type="sign-transaction" />;
        }
        // firmware bug https://github.com/trezor/trezor-firmware/issues/35
        // ugly hack to make Cardano review modal work
        // root cause of this bug is wrong button request ButtonRequest_Other from CardanoSignTx - should be ButtonRequest_SignTx
        case 'ButtonRequest_Other': {
            /*
            if (device.processMode === 'sign-tx') {
                return <ReviewTransaction type="sign-transaction" />;
            }
            */
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
        case 'ButtonRequest_ResetDevice': // dispatched on BackupDevice call for TT, weird but true
        case 'ButtonRequest_ConfirmWord': // dispatched on BackupDevice call for T1
        case 'ButtonRequest_WipeDevice':
        case 'ButtonRequest_UnknownDerivationPath':
        case 'ButtonRequest_FirmwareUpdate':
        case 'ButtonRequest_PinEntry':
            return <ConfirmActionModal device={device} renderer={renderer} />;
        case 'ButtonRequest_Address':
            return account && data?.address ? (
                <ConfirmAddress device={device} address={data.address} symbol={account.symbol} />
            ) : null;
        default:
            return null;
    }
};
