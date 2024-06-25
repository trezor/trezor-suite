import { Warning, PassphraseTypeCard, Text } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';
import { PassphraseHeading } from './PassphraseHeading';
import { OpenGuideFromTooltip } from 'src/components/guide';
import { selectDeviceModel } from '@suite-common/wallet-core';
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

    return (
        <>
            <PassphraseHeading>
                <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP3_TITLE" />
            </PassphraseHeading>
            <Warning icon="INFO" withIcon>
                <Translation
                    id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP3_WARNING"
                    values={{
                        bold: chunks => (
                            <Text variant="warning" typographyStyle="callout">
                                {chunks}
                            </Text>
                        ),
                    }}
                />
            </Warning>
            <PassphraseTypeCard
                type="hidden"
                submitLabel={<Translation id="TR_CONFIRM_PASSPHRASE" />}
                offerPassphraseOnDevice={onDeviceOffer}
                onSubmit={onSubmit}
                singleColModal
                deviceModel={deviceModel ?? undefined}
                learnMoreTooltipOnClick={
                    <OpenGuideFromTooltip
                        dataTest="@tooltip/guideAnchor"
                        id="/1_initialize-and-secure-your-trezor/6_passphrase.md"
                    />
                }
            />
        </>
    );
};
