import { useState } from 'react';

import { TrezorDevice } from '@suite-common/suite-types';
import { cancelDiscoveryThunk, startDiscoveryThunk } from '@suite-common/wallet-core';
import { DiscoveryStatus } from '@suite-common/wallet-types';

import { useDispatch } from 'src/hooks/suite';

import { EnterPassphrase } from './EnterPassphrase';
import { PassphraseWalletBestPractices } from './PassphraseWalletBestPractices';
import { PassphraseWalletConfirmation } from './PassphraseWalletConfirmation';
import { PassphraseWalletIsEmpty } from './PassphraseWalletIsEmpty';

type PassphraseWalletExistsFlowProps = {
    discovery: DiscoveryStatus;
    device: TrezorDevice;
    deviceOffer: boolean;
    authConfirmation?: boolean;
    passphraseState: string;
    submittingPassphrase: boolean;
    loading: boolean;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
};

export const PassphraseWalletExistsFlow = ({
    discovery,
    device,
    deviceOffer,
    passphraseState,
    submittingPassphrase,
    loading,
    onSubmit,
}: PassphraseWalletExistsFlowProps) => {
    const dispatch = useDispatch();
    const [confirmPassphraseFlowState, setConfirmPassphraseFlowState] = useState<
        'exists-empty-wallet' | 'exists-best-practices' | 'exists-confirm-passphrase'
    >('exists-empty-wallet');

    const onConfirmPassphraseDialogCancel = () => {
        dispatch(cancelDiscoveryThunk(device));
    };

    const onCancel = () => {
        dispatch(cancelDiscoveryThunk(device));
    };

    const toExistEnterPassphrase = () => {
        dispatch(cancelDiscoveryThunk(device));
        dispatch(
            startDiscoveryThunk({
                device,
                ...discovery,
            }),
        );
    };

    if (passphraseState === 'exists-confirm-passphrase') {
        switch (confirmPassphraseFlowState) {
            case 'exists-empty-wallet':
                return (
                    <PassphraseWalletIsEmpty
                        onCancel={onConfirmPassphraseDialogCancel}
                        onNext={() => {
                            // Navigate to best practices
                            setConfirmPassphraseFlowState('exists-best-practices');
                        }}
                        onBack={toExistEnterPassphrase}
                        device={device}
                        onRetry={toExistEnterPassphrase}
                    />
                );
            case 'exists-best-practices':
                return (
                    <PassphraseWalletBestPractices
                        onCancel={onConfirmPassphraseDialogCancel}
                        onNext={() => {
                            // Navigate to confirm passphrase
                            setConfirmPassphraseFlowState('exists-confirm-passphrase');
                        }}
                        onBack={() => {
                            // Go back to empty wallet state
                            setConfirmPassphraseFlowState('exists-empty-wallet');
                        }}
                        device={device}
                    />
                );
            case 'exists-confirm-passphrase':
                return (
                    <PassphraseWalletConfirmation
                        deviceLoading={loading}
                        device={device}
                        onCancel={onConfirmPassphraseDialogCancel}
                        onDeviceOffer={deviceOffer}
                        onSubmit={onSubmit}
                    />
                );
        }
    }

    return (
        <EnterPassphrase
            deviceLoading={loading}
            device={device}
            submitting={submittingPassphrase}
            onDeviceOffer={deviceOffer}
            onBack={onCancel}
            onCancel={onCancel}
            onSubmit={onSubmit}
        />
    );
};
