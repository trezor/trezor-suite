import { TrezorDevice } from '@suite-common/suite-types';
import { selectIsDiscoveryAuthConfirmationRequired } from '@suite-common/wallet-core';
import TrezorConnect from '@trezor/connect';

import { EnterPassphrase } from './EnterPassphrase';
import { usePassphraseModalContext } from './PassphraseModalContext';
import { PassphraseWalletConfirmation } from './PassphraseWalletConfirmation';
import { useSelector } from '../../../../../hooks/suite';

type PassphraseWalletIsNotExistFlowProps = {
    onDeviceOffer: boolean;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    device: TrezorDevice;
};

export const PassphraseWalletIsNotExistFlow = ({
    onDeviceOffer,
    onSubmit,
    device,
}: PassphraseWalletIsNotExistFlowProps) => {
    const { passphraseState, setPassphraseState } = usePassphraseModalContext();
    const authConfirmation =
        useSelector(selectIsDiscoveryAuthConfirmationRequired) || device.authConfirm;

    const onConfirmPassphraseDialogCancel = () => {
        TrezorConnect.cancel('auth-confirm-cancel');
    };

    if (authConfirmation && passphraseState === 'not-exist-confirm-passphrase') {
        return (
            <PassphraseWalletConfirmation
                onCancel={onConfirmPassphraseDialogCancel}
                onSubmit={onSubmit}
                onBack={() => {
                    setPassphraseState('not-exist-enter-passphrase');
                }}
                device={device}
                onDeviceOffer={onDeviceOffer}
            />
        );
    }

    if (passphraseState === 'not-exist-enter-passphrase') {
        return (
            <EnterPassphrase
                device={device}
                onDeviceOffer={onDeviceOffer}
                onSubmit={onSubmit}
                onBack={() => {
                    TrezorConnect.cancel('enter-passphrase-back');
                    setPassphraseState('not-exist-best-practices');
                }}
            />
        );
    }
};
