import { TrezorDevice } from '@suite-common/suite-types';

import { useSelector } from 'src/hooks/suite';
import { useServices } from 'src/reducers/services';
import {
    selectIsExistingWallet,
    selectPassphraseFlow,
    selectPassphraseFlowState,
} from 'src/reducers/wallet/passphraseFlowSelectors';

import { EnterPassphrase } from './EnterPassphrase';
import { PassphraseWalletBestPractices } from './PassphraseWalletBestPractices';
import { PassphraseWalletConfirmation } from './PassphraseWalletConfirmation';
import { PassphraseWalletIsEmpty } from './PassphraseWalletIsEmpty';

type PassphraseWalletExistsFlowProps = {
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    device: TrezorDevice;
    deviceOffer: boolean;
    authConfirmation?: boolean;
};

export const PassphraseWalletExistsFlow = ({
    onSubmit,
    device,
    deviceOffer,
}: PassphraseWalletExistsFlowProps) => {
    const { passphraseFlowManager } = useServices();
    const passphraseState = useSelector(selectPassphraseFlowState);
    const passphraseFlow = useSelector(selectPassphraseFlow);
    const isExisting = useSelector(selectIsExistingWallet);

    const onConfirmPassphraseDialogCancel = () => {
        passphraseFlowManager.cancelFlow({ reason: 'auth-confirm-cancel' });
    };

    if (isExisting) {
        if (passphraseState === 'exists-empty-wallet') {
            const onBack = () => {
                // Let the passphraseFlowManager handle the flow
                passphraseFlowManager.goBack(device);
            };

            return (
                <PassphraseWalletIsEmpty
                    onCancel={onConfirmPassphraseDialogCancel}
                    onNext={() => {
                        // Navigate to best practices
                        passphraseFlowManager.toBestPractices(device);
                    }}
                    onBack={onBack}
                    device={device}
                    onRetry={onBack}
                />
            );
        }

        if (passphraseState === 'exists-best-practices') {
            return (
                <PassphraseWalletBestPractices
                    onCancel={onConfirmPassphraseDialogCancel}
                    onNext={() => {
                        // Navigate to confirm passphrase
                        passphraseFlowManager.confirmBestPractices(device);
                    }}
                    onBack={() => {
                        // Go back to empty wallet state
                        passphraseFlowManager.goBack(device);
                    }}
                    device={device}
                />
            );
        }

        if (passphraseState === 'exists-confirm-passphrase') {
            return (
                <PassphraseWalletConfirmation
                    deviceLoading={passphraseFlow?.loading}
                    device={device}
                    onBack={() => passphraseFlowManager.goBack(device)}
                    onCancel={onConfirmPassphraseDialogCancel}
                    onDeviceOffer={deviceOffer}
                    onSubmit={onSubmit}
                />
            );
        }
    }

    if (passphraseState === 'exists-enter-passphrase') {
        return (
            <EnterPassphrase
                deviceLoading={passphraseFlow?.loading}
                device={device}
                onDeviceOffer={deviceOffer}
                onBack={() => passphraseFlowManager.goBack(device)}
                onCancel={() => {
                    passphraseFlowManager.cancelFlow({
                        reason: 'enter-passphrase-cancel',
                    });
                }}
                onSubmit={onSubmit}
            />
        );
    }
};
