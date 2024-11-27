import { Banner, Column, H3 } from '@trezor/components';
import { PassphraseTypeCard } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import { selectDeviceModel, selectDeviceFeatures } from '@suite-common/wallet-core';

import { Translation } from 'src/components/suite/Translation';
import { OpenGuideFromTooltip } from 'src/components/guide';
import { useSelector } from 'src/hooks/suite';

type PassphraseWalletConfirmationStep3Props = {
    onDeviceOffer: boolean;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
};

export const PassphraseWalletConfirmationStep3 = ({
    onDeviceOffer,
    onSubmit,
}: PassphraseWalletConfirmationStep3Props) => {
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
