import { useCallback } from 'react';

import {
    onPassphraseSubmit,
    selectIsDiscoveryAuthConfirmationRequired,
} from '@suite-common/wallet-core';

import { useDispatch, useSelector } from 'src/hooks/suite';
import type { TrezorDevice } from 'src/types/suite';

import { ConfirmPassphraseBeforeAction } from './ConfirmPassphraseBeforeAction';
import { usePassphraseModalContext } from './PassphraseModalContext';
import { PassphraseWalletExistsFlow } from './PassphraseWalletExistsFlow';
import { PassphraseWalletIsNotExistFlow } from './PassphraseWalletIsNotExistFlow';

interface PassphraseModalProps {
    device: TrezorDevice;
}

export const PassphraseModal = ({ device }: PassphraseModalProps) => {
    // @ts-expect-error device.state should not be ''
    const hasDeviceState = device.state !== undefined && device.state !== '';

    const { setPassphraseState, isExisting } = usePassphraseModalContext();
    const onDeviceOffer = !!(
        device.features &&
        device.features.capabilities &&
        device.features.capabilities.includes('Capability_PassphraseEntry')
    );

    const dispatch = useDispatch();

    const onSubmit = useCallback(
        (value: string, passphraseOnDevice?: boolean) => {
            if (isExisting) {
                setPassphraseState('exists-empty-wallet');
            } else {
                setPassphraseState('not-exist-confirm-passphrase');
            }
            dispatch(onPassphraseSubmit({ value, passphraseOnDevice: !!passphraseOnDevice }));
        },
        [dispatch, isExisting, setPassphraseState],
    );

    const authConfirmation =
        useSelector(selectIsDiscoveryAuthConfirmationRequired) || device.authConfirm;

    if (isExisting)
        return (
            <PassphraseWalletExistsFlow
                device={device}
                onSubmit={onSubmit}
                onDeviceOffer={onDeviceOffer}
                authConfirmation={authConfirmation}
            />
        );
    if (!isExisting)
        return (
            <PassphraseWalletIsNotExistFlow
                device={device}
                onSubmit={onSubmit}
                onDeviceOffer={onDeviceOffer}
            />
        );

    // "view-only" is active, device is reconnected and you fired an action that needs passphrase (e.g. add coin, show receive address)
    if (hasDeviceState) {
        return (
            <ConfirmPassphraseBeforeAction
                device={device}
                onSubmit={onSubmit}
                onDeviceOffer={onDeviceOffer}
            />
        );
    }

    throw new Error('Unexpected passphrase state');

    return null;
};
