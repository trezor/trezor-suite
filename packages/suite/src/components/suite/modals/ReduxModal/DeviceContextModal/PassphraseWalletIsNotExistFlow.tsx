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
    discovery: DiscoveryStatus;
    device: TrezorDevice;
    deviceOffer: boolean;
    onCancel?: () => void;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    onBackToInitial: () => void;
};

export const PassphraseWalletIsNotExistFlow = ({
    device,
    deviceOffer,
    discovery,
    onBackToInitial,
    onSubmit,
    onCancel,
}: PassphraseWalletIsNotExistFlowProps) => {
    const dispatch = useDispatch();

    if (discovery.status === 'starting') {
        return (
            <PassphraseWalletBestPractices
                device={device}
                onBack={onBackToInitial}
                onCancel={onCancel}
                onNext={() => dispatch(runDiscoveryThunk(device))}
            />
        );
    }

    if (discovery.status === 'confirm-empty-passphrase') {
        return (
            <PassphraseWalletConfirmation
                onCancel={onCancel}
                onSubmit={onSubmit}
                device={device}
                onDeviceOffer={deviceOffer}
            />
        );
    }

    if (discovery.status === 'enter-passphrase') {
        return (
            <EnterPassphrase
                device={device}
                submitting={discovery.passphraseSubmitted}
                onDeviceOffer={deviceOffer}
                onBack={() => {
                    dispatch(cancelDiscoveryThunk(device));
                    // TODO: best practices flow should not be initiated along with discovery
                    dispatch(
                        startDiscoveryThunk({
                            device,
                            isAddingHiddenWallet: true,
                            isAddingExistingWallet: false,
                            isAddingHiddenWalletWithRespectToSettings:
                                discovery.isAddingHiddenWalletWithRespectToSettings,
                        }),
                    );
                }}
                onCancel={onCancel}
                onSubmit={onSubmit}
            />
        );
    }
};
