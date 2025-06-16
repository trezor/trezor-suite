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
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    submittingPassphrase?: boolean;
};

export const PassphraseWalletIsNotExistFlow = ({
    device,
    deviceOffer,
    passphraseState,
    loading,
    onSubmit,
    submittingPassphrase,
}: PassphraseWalletIsNotExistFlowProps) => {
    const dispatch = useDispatch();

    const onConfirmPassphraseDialogCancel = () => {
        dispatch(cancelDiscoveryThunk(device));
    };

    if (passphraseState === 'not-exist-confirm-passphrase') {
        return (
            <PassphraseWalletConfirmation
                deviceLoading={loading}
                onCancel={onConfirmPassphraseDialogCancel}
                onSubmit={onSubmit}
                device={device}
                onDeviceOffer={deviceOffer}
            />
        );
    }

    if (passphraseState === 'not-exist-enter-passphrase') {
        return (
            <EnterPassphrase
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
                        }),
                    );
                }}
                onCancel={() => dispatch(cancelDiscoveryThunk(device))}
                onSubmit={onSubmit}
            />
        );
    }
};
