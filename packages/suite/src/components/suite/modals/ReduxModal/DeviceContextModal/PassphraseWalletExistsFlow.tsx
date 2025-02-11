import { TrezorDevice } from '@suite-common/suite-types';
import { selectIsDiscoveryAuthConfirmationRequired } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import { EnterPassphrase } from './EnterPassphrase';
import { usePassphraseModalContext } from './PassphraseModalContext';
import { PassphraseWalletBestPractices } from './PassphraseWalletBestPractices';
import { PassphraseWalletConfirmation } from './PassphraseWalletConfirmation';
import { PassphraseWalletIsEmpty } from './PassphraseWalletIsEmpty';
import { useSelector } from '../../../../../hooks/suite';

type PassphraseWalletExistsFlowProps = {
    onDeviceOffer: boolean;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    device: TrezorDevice;
};

export const PassphraseWalletExistsFlow = ({
    onDeviceOffer,
    onSubmit,
    device,
}: PassphraseWalletExistsFlowProps) => {
    const authConfirmation =
        useSelector(selectIsDiscoveryAuthConfirmationRequired) || device.authConfirm;
    const { passphraseState, setPassphraseState } = usePassphraseModalContext();

    const onConfirmPassphraseDialogCancel = () => {
        TrezorConnect.cancel('auth-confirm-cancel');
    };

    const onConfirmPassphraseDialogRetry = () => {
        TrezorConnect.cancel('auth-confirm-retry');
    };

    console.log('___TADY', authConfirmation);
    if (authConfirmation) {
        if (passphraseState === 'exists-empty-wallet') {
            return (
                <PassphraseWalletIsEmpty
                    onCancel={onConfirmPassphraseDialogCancel}
                    onNext={() => {
                        setPassphraseState('exists-best-practices');
                    }}
                    onBack={() => {
                        onConfirmPassphraseDialogRetry();
                        setPassphraseState('exists-enter-passphrase');
                    }}
                    device={device}
                    onRetry={onConfirmPassphraseDialogRetry}
                />
            );
        }

        if (passphraseState === 'exists-best-practices') {
            return (
                <PassphraseWalletBestPractices
                    onCancel={onConfirmPassphraseDialogCancel}
                    onNext={() => {
                        setPassphraseState('exists-confirm-passphrase');
                    }}
                    onBack={() => {
                        setPassphraseState('exists-empty-wallet');
                    }}
                    device={device}
                />
            );
        }
        if (passphraseState === 'exists-confirm-passphrase') {
            return (
                <PassphraseWalletConfirmation
                    onCancel={onConfirmPassphraseDialogCancel}
                    onSubmit={onSubmit}
                    onBack={() => {
                        setPassphraseState('exists-best-practices');
                    }}
                    device={device}
                    onDeviceOffer={onDeviceOffer}
                />
            );
        }
    }

    if (passphraseState === 'exists-enter-passphrase') {
        return (
            <EnterPassphrase device={device} onDeviceOffer={onDeviceOffer} onSubmit={onSubmit} />
        );
    }
};
