import { TrezorDevice } from '@suite-common/suite-types';
import {
    cancelDiscoveryThunk,
    runDiscoveryThunk,
    startDiscoveryThunk,
} from '@suite-common/wallet-core';
import { DiscoveryStatus } from '@suite-common/wallet-types';

import { useDispatch } from 'src/hooks/suite';

import { EnterPassphrase } from './EnterPassphrase';
import { PassphraseWalletBestPractices } from './PassphraseWalletBestPractices';
import { PassphraseWalletConfirmation } from './PassphraseWalletConfirmation';

type PassphraseWalletIsNotExistFlowProps = {
    device: TrezorDevice;
    deviceOffer: boolean;
    passphraseState: DiscoveryStatus['status'];
    onCancel?: () => void;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    submittingPassphrase?: boolean;
    isAddingHiddenWalletWithRespectToSettings?: boolean;
    onBackToInitial: () => void;
};

export const PassphraseWalletIsNotExistFlow = ({
    device,
    deviceOffer,
    passphraseState,
    onBackToInitial,
    onSubmit,
    onCancel,
    submittingPassphrase,
    isAddingHiddenWalletWithRespectToSettings,
}: PassphraseWalletIsNotExistFlowProps) => {
    const dispatch = useDispatch();

    if (passphraseState === 'starting') {
        return (
            <PassphraseWalletBestPractices
                device={device}
                onBack={onBackToInitial}
                onCancel={onCancel}
                onNext={() => dispatch(runDiscoveryThunk(device))}
            />
        );
    }

    if (passphraseState === 'confirm-empty-passphrase') {
        return (
            <PassphraseWalletConfirmation
                onCancel={onCancel}
                onSubmit={onSubmit}
                device={device}
                onDeviceOffer={deviceOffer}
            />
        );
    }

    if (passphraseState === 'enter-passphrase') {
        return (
            <EnterPassphrase
                device={device}
                submitting={submittingPassphrase}
                onDeviceOffer={deviceOffer}
                onBack={() => {
                    dispatch(cancelDiscoveryThunk(device));
                    // TODO: best practices flow should not be initiated along with discovery
                    dispatch(
                        startDiscoveryThunk({
                            device,
                            isAddingHiddenWallet: true,
                            isAddingExistingWallet: false,
                            isAddingHiddenWalletWithRespectToSettings,
                        }),
                    );
                }}
                onCancel={onCancel}
                onSubmit={onSubmit}
            />
        );
    }
};
