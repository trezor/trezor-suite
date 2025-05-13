import { useCallback } from 'react';

import { TrezorDevice } from '@suite-common/suite-types';
import {
    cancelDiscoveryThunk,
    runDiscovery,
    selectDiscoveryByDevicePath,
    selectIsDiscoveryAuthConfirmationRequired,
    submitPassphrase,
} from '@suite-common/wallet-core';
import { DiscoveryStatus } from '@suite-common/wallet-types';
import { UI } from '@trezor/connect';

import { MODAL } from 'src/actions/suite/constants';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { AppState } from 'src/reducers/store';

import { PassphraseWalletBestPractices } from './PassphraseWalletBestPractices';
import { PassphraseWalletExistsFlow } from './PassphraseWalletExistsFlow';
import { PassphraseWalletIsNotExistFlow } from './PassphraseWalletIsNotExistFlow';
import { DiscoveryLoader } from '../../ModalSwitcher/DiscoveryLoader';
import { PassphraseDuplicateModal } from '../UserContextModal/PassphraseDuplicateModal';
import { PassphraseMismatchModal } from '../UserContextModal/PassphraseMismatchModal';

const determinePassphraseFlowState = (
    discovery: DiscoveryStatus,
    modalState: AppState['modal'],
) => {
    if (discovery.status === 'progress') {
        return {
            isExisting: discovery.isAddingExistingWallet,
            screen: 'discovery-loader',
            discovery,
        } as const;
    }

    if (discovery.isAddingExistingWallet) {
        if (discovery.status === 'enter-passphrase') {
            return {
                isExisting: true,
                screen: 'exists-enter-passphrase',
                discovery,
                loading: !(
                    modalState.context === MODAL.CONTEXT_DEVICE &&
                    modalState.windowType === UI.REQUEST_PASSPHRASE
                ),
            } as const;
        }

        if (discovery.status === 'confirm-empty-passphrase') {
            return {
                isExisting: true,
                screen: 'exists-confirm-passphrase',
                discovery,
            } as const;
        }

        if (discovery.status === 'passphrase-duplicate') {
            return {
                isExisting: true,
                screen: 'passphrase-duplicate',
                discovery,
            } as const;
        }

        if (discovery.status === 'passphrase-mismatch') {
            return {
                isExisting: true,
                screen: 'exists-passphrase-mismatch-warning',
                discovery,
            } as const;
        }
    }

    if (discovery.status === 'enter-passphrase') {
        return {
            isExisting: false,
            screen: 'not-exist-enter-passphrase',
            discovery,
            loading: !(
                modalState.context === MODAL.CONTEXT_DEVICE &&
                modalState.windowType === UI.REQUEST_PASSPHRASE
            ),
        } as const;
    }

    if (discovery.status === 'confirm-empty-passphrase') {
        return {
            isExisting: false,
            screen: 'not-exist-confirm-passphrase',
            discovery,
        } as const;
    }

    if (discovery.status === 'passphrase-duplicate') {
        return {
            isExisting: false,
            screen: 'passphrase-duplicate',
            discovery,
        } as const;
    }

    if (discovery.status === 'passphrase-mismatch') {
        return {
            isExisting: false,
            screen: 'not-exist-passphrase-mismatch-warning',
            discovery,
        } as const;
    }

    return {
        isExisting: false,
        screen: 'not-exist-best-practices',
        discovery,
    } as const;
};

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
                    onNext={() => dispatch(runDiscovery(device))}
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
            discovery={passphraseState.discovery}
            device={device}
            passphraseState={passphraseState.screen}
            loading={Boolean(passphraseState.loading)}
            deviceOffer={deviceOffer}
            onSubmit={onSubmit}
        />
    );
};
