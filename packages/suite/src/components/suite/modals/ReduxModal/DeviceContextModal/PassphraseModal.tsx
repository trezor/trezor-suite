import { useCallback } from 'react';

import { selectModalRequestId } from '@suite/modal';
import { goto } from '@suite/router';
import { selectHasDevicePassphraseEntryCapability } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import {
    cancelDiscoveryThunk,
    selectDiscoveryByDevicePath,
    selectIsDiscoveryStatusConfirmEmptyPassphrase,
    submitPassphrase,
} from '@suite-common/wallet-core';
import { UI_REQUEST } from '@trezor/connect';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { PassphraseWalletExistsFlow } from './PassphraseWalletExistsFlow';
import { PassphraseWalletIsNotExistFlow } from './PassphraseWalletIsNotExistFlow';
import { DiscoveryLoader } from '../../ModalSwitcher/DiscoveryLoader';
import { PassphraseDuplicateModal } from '../UserContextModal/PassphraseDuplicateModal';
import { PassphraseMismatchModal } from '../UserContextModal/PassphraseMismatchModal';

export const PassphraseModal = ({ device }: { device: TrezorDevice }) => {
    const discovery = useSelector(state => selectDiscoveryByDevicePath(state, device?.path));
    const requestId = useSelector(selectModalRequestId);
    const dispatch = useDispatch();

    const onPassphraseConfirm = useCallback(
        (value: string, passphraseOnDevice?: boolean) => {
            if (!discovery) return;

            dispatch(
                submitPassphrase({
                    device,
                    passphrase: value,
                    passphraseOnDevice,
                    requestId,
                }),
            );
        },
        [discovery, dispatch, device, requestId],
    );

    const confirmEmptyPassphrase = useSelector(state =>
        selectIsDiscoveryStatusConfirmEmptyPassphrase(state, device?.path),
    );

    const onBackToInitial = () => {
        dispatch(cancelDiscoveryThunk(device));
        dispatch({ type: UI_REQUEST.CLOSE_UI_WINDOW });
        dispatch(goto({ routeName: 'suite-switch-device', params: { cancelable: true } }));
    };

    const onCancel = () => {
        dispatch(cancelDiscoveryThunk(device));
        dispatch({ type: UI_REQUEST.CLOSE_UI_WINDOW });
    };

    const onSubmit = useCallback(
        (value: string, passphraseOnDevice?: boolean) => {
            if (!device || !discovery) return;

            if (confirmEmptyPassphrase) {
                onPassphraseConfirm(value, passphraseOnDevice);

                return;
            }

            dispatch(
                submitPassphrase({
                    device,
                    passphrase: value,
                    passphraseOnDevice,
                    requestId,
                }),
            );
        },
        [device, confirmEmptyPassphrase, dispatch, discovery, onPassphraseConfirm, requestId],
    );

    const offerPassphraseOnDevice = useSelector(selectHasDevicePassphraseEntryCapability);

    if (!device || !discovery || !discovery.isAddingHiddenWallet) return null;

    switch (discovery.status) {
        case 'progress':
            return <DiscoveryLoader />;

        case 'passphrase-duplicate':
            return <PassphraseDuplicateModal device={device} discovery={discovery} />;

        case 'passphrase-mismatch':
            return <PassphraseMismatchModal device={device} discovery={discovery} />;
    }

    if (discovery.isAddingExistingWallet) {
        return (
            <PassphraseWalletExistsFlow
                device={device}
                offerPassphraseOnDevice={offerPassphraseOnDevice}
                discovery={discovery}
                onBackToInitial={onBackToInitial}
                onCancel={onCancel}
                onSubmit={onSubmit}
            />
        );
    }

    return (
        <PassphraseWalletIsNotExistFlow
            device={device}
            offerPassphraseOnDevice={offerPassphraseOnDevice}
            discovery={discovery}
            onBackToInitial={onBackToInitial}
            onCancel={onCancel}
            onSubmit={onSubmit}
        />
    );
};
