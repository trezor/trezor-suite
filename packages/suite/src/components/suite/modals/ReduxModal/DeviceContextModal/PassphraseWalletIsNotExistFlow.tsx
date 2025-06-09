import { TrezorDevice } from '@suite-common/suite-types';
import { cancelDiscoveryThunk, startDiscoveryThunk } from '@suite-common/wallet-core';

import { useDispatch } from 'src/hooks/suite';

import { EnterPassphrase } from './EnterPassphrase';
import { PassphraseWalletConfirmation } from './PassphraseWalletConfirmation';

type PassphraseWalletIsNotExistFlowProps = {
    device: TrezorDevice;
    deviceOffer: boolean;
    passphraseState: string;
    loading: boolean;
    onCancel: () => void;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    submittingPassphrase?: boolean;
    isAddingHiddenWalletWithRespectToSettings?: boolean;
};

export const PassphraseWalletIsNotExistFlow = ({
    device,
    deviceOffer,
    passphraseState,
    loading,
    onSubmit,
    onCancel,
    submittingPassphrase,
    isAddingHiddenWalletWithRespectToSettings,
}: PassphraseWalletIsNotExistFlowProps) => {
    const dispatch = useDispatch();

    if (passphraseState === 'not-exist-confirm-passphrase') {
        return (
            <PassphraseWalletConfirmation
                deviceLoading={loading}
                onCancel={onCancel}
                onSubmit={onSubmit}
                device={device}
                onDeviceOffer={deviceOffer}
            />
        );
    }

    if (passphraseState === 'not-exist-enter-passphrase') {
        return (
            <EnterPassphrase
                cancelDisabled={isAddingHiddenWalletWithRespectToSettings}
                deviceLoading={loading}
                device={device}
                submitting={submittingPassphrase}
                onDeviceOffer={deviceOffer}
                onBack={() => {
                    dispatch(cancelDiscoveryThunk(device));
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
