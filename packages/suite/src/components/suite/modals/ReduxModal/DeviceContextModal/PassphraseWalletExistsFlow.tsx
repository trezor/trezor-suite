import { TrezorDevice } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';

import { EnterPassphrase } from './EnterPassphrase';
import { usePassphraseModalContext } from './PassphraseModalContext';
import { PassphraseWalletBestPractices } from './PassphraseWalletBestPractices';
import { PassphraseWalletConfirmation } from './PassphraseWalletConfirmation';
import { PassphraseWalletIsEmpty } from './PassphraseWalletIsEmpty';

type PassphraseWalletExistsFlowProps = {
    onDeviceOffer: boolean;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    device: TrezorDevice;
    authConfirmation?: boolean;
};

export const PassphraseWalletExistsFlow = ({
    onDeviceOffer,
    onSubmit,
    device,
    authConfirmation,
}: PassphraseWalletExistsFlowProps) => {
    const { passphraseState, setPassphraseState } = usePassphraseModalContext();

    const onConfirmPassphraseDialogCancel = () => {
        TrezorConnect.cancel('auth-confirm-cancel');
    };

    const onConfirmPassphraseDialogRetry = () => {
        TrezorConnect.cancel('auth-confirm-retry');
    };

    if (authConfirmation) {
        if (passphraseState === 'exists-empty-wallet') {
            const onBack = () => {
                onConfirmPassphraseDialogRetry();
                setPassphraseState('exists-enter-passphrase');
            };

            return (
                <PassphraseWalletIsEmpty
                    onCancel={onConfirmPassphraseDialogCancel}
                    onNext={() => {
                        setPassphraseState('exists-best-practices');
                    }}
                    onBack={onBack}
                    device={device}
                    onRetry={onBack}
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
        const onEnterPassphraseDialogBack = () => {
            TrezorConnect.cancel('enter-passphrase-back');
            setPassphraseState('initial');
        };

        return (
            <EnterPassphrase
                device={device}
                onDeviceOffer={onDeviceOffer}
                onSubmit={onSubmit}
                onBack={onEnterPassphraseDialogBack}
            />
        );
    }
};
