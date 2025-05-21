import { useCallback } from 'react';

import { TrezorDevice } from '@suite-common/suite-types';
import {
    cancelDiscoveryThunk,
    determinePassphraseFlowState,
    runDiscoveryThunk,
    selectDiscoveryByDevicePath,
    selectIsDiscoveryAuthConfirmationRequired,
    submitPassphrase,
} from '@suite-common/wallet-core';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { PassphraseWalletBestPractices } from './PassphraseWalletBestPractices';
import { PassphraseWalletExistsFlow } from './PassphraseWalletExistsFlow';
import { PassphraseWalletIsNotExistFlow } from './PassphraseWalletIsNotExistFlow';
import { DiscoveryLoader } from '../../ModalSwitcher/DiscoveryLoader';
import { PassphraseDuplicateModal } from '../UserContextModal/PassphraseDuplicateModal';
import { PassphraseMismatchModal } from '../UserContextModal/PassphraseMismatchModal';

// Using the shared determinePassphraseFlowState function from suite-common/wallet-core

export const PassphraseModal = ({ device }: { device: TrezorDevice }) => {
    const discovery = useSelector(state => selectDiscoveryByDevicePath(state, device?.path));
    const modal = useSelector(state => state.modal);

    const dispatch = useDispatch();

    const passphraseState = discovery ? determinePassphraseFlowState(discovery, modal) : null;

    const onPassphraseConfirm = useCallback(
        (value: string, passphraseOnDevice?: boolean) => {
            if (!passphraseState?.discovery) return;

            dispatch(
                submitPassphrase({
                    device,
                    passphrase: value,
                    passphraseOnDevice,
                }),
            );
        },
        [passphraseState?.discovery, dispatch, device],
    );

    const authConfirmation = useSelector(state =>
        selectIsDiscoveryAuthConfirmationRequired(state, device?.path),
    );

    const cancel = useCallback(() => {
        if (!passphraseState?.discovery) return;
        dispatch(cancelDiscoveryThunk(device));
    }, [device, dispatch, passphraseState?.discovery]);

    const onSubmit = useCallback(
        (value: string, passphraseOnDevice?: boolean) => {
            if (!device) return;
            if (!passphraseState?.discovery) return;

            if (authConfirmation) {
                onPassphraseConfirm(value, passphraseOnDevice);

                return;
            }

            dispatch(
                submitPassphrase({
                    device,
                    passphrase: value,
                    passphraseOnDevice,
                }),
            );
        },
        [device, authConfirmation, dispatch, passphraseState?.discovery, onPassphraseConfirm],
    );

    if (!device || !passphraseState) return null;

    const deviceOffer = !!(
        device.features &&
        device.features.capabilities &&
        device.features.capabilities.includes('Capability_PassphraseEntry')
    );

    switch (passphraseState?.screen) {
        case 'discovery-loader':
            return <DiscoveryLoader />;

        case 'passphrase-duplicate':
            return (
                <PassphraseDuplicateModal
                    isExistingWallet={passphraseState.isExisting}
                    device={device}
                    discovery={passphraseState.discovery}
                />
            );

        case 'exists-passphrase-mismatch-warning':
        case 'not-exist-passphrase-mismatch-warning':
            return (
                <PassphraseMismatchModal device={device} discovery={passphraseState.discovery} />
            );

        case 'not-exist-best-practices':
            return (
                <PassphraseWalletBestPractices
                    device={device}
                    onBack={cancel}
                    onCancel={cancel}
                    onNext={() => dispatch(runDiscoveryThunk(device))}
                />
            );
    }

    if (passphraseState.isExisting)
        return (
            <PassphraseWalletExistsFlow
                discovery={passphraseState.discovery}
                device={device}
                passphraseState={passphraseState.screen}
                loading={Boolean(passphraseState.loading)}
                deviceOffer={deviceOffer}
                authConfirmation={authConfirmation}
                onSubmit={onSubmit}
            />
        );

    return (
        <PassphraseWalletIsNotExistFlow
            device={device}
            passphraseState={passphraseState.screen}
            loading={Boolean(passphraseState.loading)}
            deviceOffer={deviceOffer}
            onSubmit={onSubmit}
        />
    );
};
