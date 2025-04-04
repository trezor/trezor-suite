import { useCallback } from 'react';

import {
    selectIsDiscoveryAuthConfirmationRequired,
    selectSelectedDevice,
} from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';
import { useServices } from 'src/reducers/services';
import {
    selectIsExistingWallet,
    selectPassphraseFlow,
} from 'src/reducers/wallet/passphraseFlowSelectors';

import { PassphraseWalletBestPractices } from './PassphraseWalletBestPractices';
import { PassphraseWalletExistsFlow } from './PassphraseWalletExistsFlow';
import { PassphraseWalletIsNotExistFlow } from './PassphraseWalletIsNotExistFlow';
import { DiscoveryLoader } from '../../ModalSwitcher/DiscoveryLoader';
import { PassphraseDuplicateModal } from '../UserContextModal/PassphraseDuplicateModal';
import { PassphraseMismatchModal } from '../UserContextModal/PassphraseMismatchModal';

export const PassphraseModal = () => {
    const passphraseState = useSelector(selectPassphraseFlow);
    const device = useSelector(selectSelectedDevice);

    const isExisting = useSelector(selectIsExistingWallet);

    const { passphraseFlowManager } = useServices();

    const onPassphraseConfirm = useCallback(
        (value: string, passphraseOnDevice?: boolean) => {
            passphraseFlowManager.confirmPassphrase(value, {
                passphraseOnDevice: !!passphraseOnDevice,
            });
        },
        [passphraseFlowManager],
    );

    const authConfirmation =
        useSelector(selectIsDiscoveryAuthConfirmationRequired) || device?.authConfirm;

    const onSubmit = useCallback(
        (value: string, passphraseOnDevice?: boolean) => {
            if (!device) return;

            if (authConfirmation) {
                onPassphraseConfirm(value, passphraseOnDevice);

                return;
            }

            passphraseFlowManager.submitPassphrase(value, {
                device,
                passphraseOnDevice: !!passphraseOnDevice,
            });
        },
        [passphraseFlowManager, authConfirmation, onPassphraseConfirm, device],
    );

    if (!device) return null;

    const deviceOffer = !!(
        device.features &&
        device.features.capabilities &&
        device.features.capabilities.includes('Capability_PassphraseEntry')
    );

    switch (passphraseState?.state) {
        case 'initial':
            return null;

        case 'not-exist-awaiting-discovery':
        case 'exists-awaiting-discovery':
            return <DiscoveryLoader />;

        case 'passphrase-duplicate':
            return <PassphraseDuplicateModal device={device} />;

        case 'exists-passphrase-mismatch-warning':
        case 'not-exist-passphrase-mismatch-warning':
            return <PassphraseMismatchModal />;

        case 'not-exist-best-practices':
        case 'exists-best-practices':
            return (
                <PassphraseWalletBestPractices
                    device={device}
                    onBack={() => passphraseFlowManager.goBack(device)}
                    onCancel={() => passphraseFlowManager.cancelFlow()}
                    onNext={() => passphraseFlowManager.confirmBestPractices(device)}
                />
            );
    }

    if (isExisting)
        return (
            <PassphraseWalletExistsFlow
                device={device}
                deviceOffer={deviceOffer}
                authConfirmation={authConfirmation}
                onSubmit={onSubmit}
            />
        );

    return (
        <PassphraseWalletIsNotExistFlow
            device={device}
            deviceOffer={deviceOffer}
            onSubmit={onSubmit}
        />
    );
};
