import { useCallback } from 'react';

import { TrezorDevice } from '@suite-common/suite-types';
import {
    cancelDiscoveryThunk,
    selectDiscoveryByDevicePath,
    selectIsDiscoveryAuthConfirmationRequired,
    submitPassphrase,
} from '@suite-common/wallet-core';
import { UI } from '@trezor/connect';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { PassphraseWalletExistsFlow } from './PassphraseWalletExistsFlow';
import { PassphraseWalletIsNotExistFlow } from './PassphraseWalletIsNotExistFlow';
import { DiscoveryLoader } from '../../ModalSwitcher/DiscoveryLoader';
import { PassphraseDuplicateModal } from '../UserContextModal/PassphraseDuplicateModal';
import { PassphraseMismatchModal } from '../UserContextModal/PassphraseMismatchModal';

export const PassphraseModal = ({ device }: { device: TrezorDevice }) => {
    const discovery = useSelector(state => selectDiscoveryByDevicePath(state, device?.path));
    const dispatch = useDispatch();

    const onPassphraseConfirm = useCallback(
        (value: string, passphraseOnDevice?: boolean) => {
            if (!discovery) return;

            dispatch(
                submitPassphrase({
                    device,
                    passphrase: value,
                    passphraseOnDevice,
                }),
            );
        },
        [discovery, dispatch, device],
    );

    const authConfirmation = useSelector(state =>
        selectIsDiscoveryAuthConfirmationRequired(state, device?.path),
    );

    const onBackToInitial = () => {
        dispatch(cancelDiscoveryThunk(device));
        dispatch({ type: UI.CLOSE_UI_WINDOW });
        dispatch(
            goto('suite-switch-device', {
                params: {
                    cancelable: discovery?.isAddingHiddenWalletWithRespectToSettings !== true,
                },
            }),
        );
    };

    const onCancel =
        discovery?.isAddingHiddenWalletWithRespectToSettings === true
            ? undefined
            : () => {
                  dispatch(cancelDiscoveryThunk(device));
                  dispatch({ type: UI.CLOSE_UI_WINDOW });
              };

    const onSubmit = useCallback(
        (value: string, passphraseOnDevice?: boolean) => {
            if (!device || !discovery) return;

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
        [device, authConfirmation, dispatch, discovery, onPassphraseConfirm],
    );

    if (!device || !discovery || !discovery.isAddingHiddenWallet) return null;

    const deviceOffer = !!device?.features?.capabilities.includes('Capability_PassphraseEntry');

    switch (discovery.status) {
        case 'progress':
            return <DiscoveryLoader />;

        case 'passphrase-duplicate':
            return (
                <PassphraseDuplicateModal
                    isExistingWallet={!!discovery.isAddingExistingWallet}
                    device={device}
                    discovery={discovery}
                />
            );

        case 'passphrase-mismatch':
            return <PassphraseMismatchModal device={device} discovery={discovery} />;
    }

    if (discovery.isAddingExistingWallet) {
        return (
            <PassphraseWalletExistsFlow
                discovery={discovery}
                device={device}
                deviceOffer={deviceOffer}
                authConfirmation={authConfirmation}
                onBackToInitial={onBackToInitial}
                onCancel={onCancel}
                onSubmit={onSubmit}
            />
        );
    }

    return (
        <PassphraseWalletIsNotExistFlow
            discovery={discovery}
            device={device}
            isAddingHiddenWalletWithRespectToSettings={
                discovery.isAddingHiddenWalletWithRespectToSettings
            }
            onBackToInitial={onBackToInitial}
            deviceOffer={deviceOffer}
            onCancel={onCancel}
            onSubmit={onSubmit}
        />
    );
};
