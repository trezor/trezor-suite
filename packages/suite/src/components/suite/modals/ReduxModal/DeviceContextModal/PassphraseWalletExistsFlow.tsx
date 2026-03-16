import { useState } from 'react';

import { type TrezorDevice } from '@suite-common/suite-types';
import { cancelDiscoveryThunk, startDiscoveryThunk } from '@suite-common/wallet-core';
import { type DiscoveryStatus } from '@suite-common/wallet-types';

import { useDispatch } from 'src/hooks/suite';

import { EnterPassphrase } from './EnterPassphrase';
import { PassphraseWalletBestPractices } from './PassphraseWalletBestPractices';
import { PassphraseWalletConfirmation } from './PassphraseWalletConfirmation';
import { PassphraseWalletIsEmpty } from './PassphraseWalletIsEmpty';

type PassphraseWalletExistsFlowProps = {
    discovery: DiscoveryStatus;
    device: TrezorDevice;
    offerPassphraseOnDevice: boolean;
    onCancel: () => void;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    onBackToInitial: () => void;
};

export const PassphraseWalletExistsFlow = ({
    discovery,
    device,
    offerPassphraseOnDevice,
    onCancel,
    onSubmit,
    onBackToInitial,
}: PassphraseWalletExistsFlowProps) => {
    const dispatch = useDispatch();
    const [confirmPassphraseFlowState, setConfirmPassphraseFlowState] = useState<
        'empty-wallet' | 'best-practices' | 'confirm-passphrase'
    >('empty-wallet');

    const toExistEnterPassphrase = () => {
        dispatch(cancelDiscoveryThunk(device));
        dispatch(
            startDiscoveryThunk({
                device,
                ...discovery,
            }),
        );
    };

    if (discovery.status === 'confirm-empty-passphrase') {
        switch (confirmPassphraseFlowState) {
            case 'empty-wallet':
                return (
                    <PassphraseWalletIsEmpty
                        accountFailed={discovery.accountFailed}
                        onCancel={onCancel}
                        onNext={() => {
                            // Navigate to best practices
                            setConfirmPassphraseFlowState('best-practices');
                        }}
                        onBack={toExistEnterPassphrase}
                        device={device}
                        onRetry={toExistEnterPassphrase}
                    />
                );
            case 'best-practices':
                return (
                    <PassphraseWalletBestPractices
                        onCancel={onCancel}
                        onNext={() => {
                            // Navigate to confirm passphrase
                            setConfirmPassphraseFlowState('confirm-passphrase');
                        }}
                        onBack={() => {
                            // Go back to empty wallet state
                            setConfirmPassphraseFlowState('empty-wallet');
                        }}
                        device={device}
                    />
                );
            case 'confirm-passphrase':
                return (
                    <PassphraseWalletConfirmation
                        isExistingWallet={true}
                        device={device}
                        onCancel={onCancel}
                        offerPassphraseOnDevice={offerPassphraseOnDevice}
                        onSubmit={onSubmit}
                    />
                );
        }
    }

    return (
        <EnterPassphrase
            isExistingWallet={true}
            device={device}
            submitting={discovery.passphraseSubmitted}
            offerPassphraseOnDevice={offerPassphraseOnDevice}
            onBack={onBackToInitial}
            onCancel={onCancel}
            onSubmit={onSubmit}
        />
    );
};
