import { Translation } from '@suite/intl';
import { selectDeviceModel } from '@suite-common/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { selectDiscoveryByDevicePath } from '@suite-common/wallet-core';
import { Banner, Column, H3 } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from 'src/views/suite/SwitchDevice/SwitchDeviceModal';

import { PassphraseInputCard } from './PassphraseInputCard';

type PassphraseWalletConfirmationProps = {
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    offerPassphraseOnDevice: boolean;
    onCancel: () => void;
    onBack?: () => void;
    device: TrezorDevice;
    isExistingWallet?: boolean;
};

export const PassphraseWalletConfirmation = ({
    onCancel,
    onBack,
    onSubmit,
    offerPassphraseOnDevice,
    device,
    isExistingWallet,
}: PassphraseWalletConfirmationProps) => {
    const deviceModel = useSelector(selectDeviceModel);
    const discovery = useSelector(state => selectDiscoveryByDevicePath(state, device.path));

    // Scoped add-wallet flow: REQUEST_PASSPHRASE is kept out of the global modal, so the device's
    // readiness for the passphrase comes from discovery.status.
    const isDeviceLoading = !(
        discovery?.status === 'enter-passphrase' || discovery?.status === 'confirm-empty-passphrase'
    );

    return (
        <SwitchDeviceModal onCancel={onCancel}>
            <CardWithDevice onCancel={onCancel} device={device} onBackButtonClick={onBack}>
                <Column gap={spacings.sm}>
                    <H3>
                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP3_TITLE" />
                    </H3>
                    <Banner
                        icon="info"
                        description={
                            <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP3_WARNING" />
                        }
                    />
                    <PassphraseInputCard
                        isDeviceLoading={isDeviceLoading}
                        deviceModel={deviceModel ?? undefined}
                        onSubmit={onSubmit}
                        offerPassphraseOnDevice={offerPassphraseOnDevice}
                        allowNonAsciiCharacters={isExistingWallet}
                    />
                </Column>
            </CardWithDevice>
        </SwitchDeviceModal>
    );
};
