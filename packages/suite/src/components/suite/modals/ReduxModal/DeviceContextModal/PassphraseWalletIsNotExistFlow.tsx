import { TrezorDevice } from '@suite-common/suite-types';
import { cancelDiscoveryThunk, startDiscoveryThunk } from '@suite-common/wallet-core';
import { UI } from '@trezor/connect-web';

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

    const onCancel = () => {
        dispatch({ type: UI.CLOSE_UI_WINDOW });
        dispatch(cancelDiscoveryThunk(device));
    };

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
                onCancel={onCancel}
                onSubmit={onSubmit}
            />
        );
    }
};
