import { TrezorDevice } from '@suite-common/suite-types';
import { selectDeviceModel } from '@suite-common/wallet-core';
import { Banner, Column, H3 } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from 'src/views/suite/SwitchDevice/SwitchDeviceModal';

import { PassphraseInputCard } from './PassphraseInputCard';
import { useSelector } from '../../../../../hooks/suite';
import { Translation } from '../../../Translation';

type PassphraseWalletConfirmationContentProps = {
    onDeviceOffer: boolean;
    deviceLoading?: boolean;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
};

const PassphraseWalletConfirmationContent = ({
    onDeviceOffer,
    deviceLoading,
    onSubmit,
}: PassphraseWalletConfirmationContentProps) => {
    const deviceModel = useSelector(selectDeviceModel);

    return (
        <Column gap={spacings.sm}>
            <H3>
                <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP3_TITLE" />
            </H3>
            <Banner icon="info">
                <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP3_WARNING" />
            </Banner>
            <PassphraseInputCard
                deviceModel={deviceModel ?? undefined}
                deviceLoading={deviceLoading}
                onSubmit={onSubmit}
                offerPassphraseOnDevice={onDeviceOffer}
            />
        </Column>
    );
};

type PassphraseWalletConfirmationProps = {
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    onDeviceOffer: boolean;
    onCancel: () => void;
    onBack?: () => void;
    device: TrezorDevice;
    deviceLoading?: boolean;
};

export const PassphraseWalletConfirmation = ({
    onCancel,
    onBack,
    onSubmit,
    onDeviceOffer,
    device,
    deviceLoading,
}: PassphraseWalletConfirmationProps) => (
    <SwitchDeviceModal onCancel={onCancel}>
        <CardWithDevice
            onCancel={onCancel}
            device={device}
            onBackButtonClick={onBack}
            isFullHeaderVisible
        >
            <PassphraseWalletConfirmationContent
                onDeviceOffer={onDeviceOffer}
                deviceLoading={deviceLoading}
                onSubmit={onSubmit}
            />
        </CardWithDevice>
    </SwitchDeviceModal>
);
