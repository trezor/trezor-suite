import { Warning, PassphraseTypeCard } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';
import { PassphraseHeading } from './PassphraseHeading';
import { OpenGuideFromTooltip } from 'src/components/guide';

type PassphraseWalletConfirmationStep3Props = {
    onDeviceOffer: boolean;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
};

export const PassphraseWalletConfirmationStep3 = ({
    onDeviceOffer,
    onSubmit,
}: PassphraseWalletConfirmationStep3Props) => (
    <>
        <PassphraseHeading>
            <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP3_TITLE" />
        </PassphraseHeading>
        <Warning icon="INFO">
            <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP3_WARNING" />
        </Warning>
        <PassphraseTypeCard
            type="hidden"
            submitLabel={<Translation id="TR_CONFIRM_PASSPHRASE" />}
            offerPassphraseOnDevice={onDeviceOffer}
            onSubmit={onSubmit}
            singleColModal
            learnMoreTooltipOnClick={
                <OpenGuideFromTooltip
                    dataTest="@tooltip/guideAnchor"
                    id="/1_initialize-and-secure-your-trezor/6_passphrase.md"
                />
            }
        />
    </>
);
