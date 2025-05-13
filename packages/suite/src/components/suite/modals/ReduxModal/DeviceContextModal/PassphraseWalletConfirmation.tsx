import { TrezorDevice } from '@suite-common/suite-types';
import { selectDeviceFeatures, selectDeviceModel } from '@suite-common/wallet-core';
import { Banner, Column, H3 } from '@trezor/components';
import { PassphraseTypeCard } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from 'src/views/suite/SwitchDevice/SwitchDeviceModal';

import { useSelector } from '../../../../../hooks/suite';
import { OpenGuideFromTooltip } from '../../../../guide';
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
    const deviceFeatures = useSelector(selectDeviceFeatures);

    return (
        <Column gap={spacings.sm} margin={{ top: spacings.xxs }}>
            <H3>
                <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP3_TITLE" />
            </H3>
            <Banner icon="info">
                <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP3_WARNING" />
            </Banner>
            <PassphraseTypeCard
                deviceLoading={deviceLoading}
                type="hidden"
                submitLabel={<Translation id="TR_CONFIRM_PASSPHRASE" />}
                offerPassphraseOnDevice={onDeviceOffer}
                onSubmit={onSubmit}
                singleColModal
                deviceModel={deviceModel ?? undefined}
                deviceBackup={deviceFeatures?.backup_type}
                learnMoreTooltipOnClick={
                    <OpenGuideFromTooltip
                        data-testid="@tooltip/guideAnchor"
                        id="/1_initialize-and-secure-your-trezor/6_passphrase.md"
                    />
                }
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
