import { TrezorDevice } from '@suite-common/suite-types';

import { useSelector } from 'src/hooks/suite';
import { useServices } from 'src/reducers/services';
import {
    selectPassphraseFlow,
    selectPassphraseFlowState,
} from 'src/reducers/wallet/passphraseFlowSelectors';

import { EnterPassphrase } from './EnterPassphrase';
import { PassphraseWalletConfirmation } from './PassphraseWalletConfirmation';

type PassphraseWalletIsNotExistFlowProps = {
    device: TrezorDevice;
    deviceOffer: boolean;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
};

export const PassphraseWalletIsNotExistFlow = ({
    device,
    deviceOffer,
    onSubmit,
}: PassphraseWalletIsNotExistFlowProps) => {
    const { passphraseFlowManager } = useServices();
    const passphraseState = useSelector(selectPassphraseFlowState);
    const passphraseFlow = useSelector(selectPassphraseFlow);

    const onConfirmPassphraseDialogCancel = () => {
        passphraseFlowManager.cancelFlow({ reason: 'auth-confirm-cancel' });
    };

    if (passphraseState === 'not-exist-confirm-passphrase') {
        return (
            <PassphraseWalletConfirmation
                deviceLoading={passphraseFlow?.loading}
                onCancel={onConfirmPassphraseDialogCancel}
                onSubmit={onSubmit}
                onBack={() => passphraseFlowManager.goBack(device)}
                device={device}
                onDeviceOffer={deviceOffer}
            />
        );
    }

    if (passphraseState === 'not-exist-enter-passphrase') {
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
