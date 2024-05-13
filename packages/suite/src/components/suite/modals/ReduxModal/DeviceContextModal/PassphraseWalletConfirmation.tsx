import { AcquiredDevice, TrezorDevice } from '@suite-common/suite-types';
import {
    Button,
    Card,
    Text,
    PassphraseTypeCard,
    Rows,
    Columns,
    Warning,
    Icon,
} from '@trezor/components';
import { useState } from 'react';
import { OpenGuideFromTooltip } from 'src/components/guide';
import { Translation } from 'src/components/suite/Translation';
import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceRenderer } from 'src/views/suite/SwitchDevice/SwitchDeviceRenderer';
import { PassphraseList, PassphraseItem } from './PassphraseList';
import { PassphraseHeading } from './PassphraseHeading';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';
import { TrezorLink } from 'src/components/suite/TrezorLink';
import { useDispatch } from 'src/hooks/suite';

type ContentType = 'step1' | 'step2' | 'step3';

type PassphraseWalletConfirmationContentProps = {
    authConfirmation?: boolean;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    onDeviceOffer: boolean;
    onCancel: () => void;
};

type PassphraseWalletConfirmationProps = PassphraseWalletConfirmationContentProps & {
    device: TrezorDevice;
};

const PassphraseWalletConfirmationContent = ({
    authConfirmation,
    onSubmit,
    onDeviceOffer,
    onCancel,
}: PassphraseWalletConfirmationContentProps) => {
    const [contentType, setContentType] = useState<ContentType>('step1');
    // const dispatch = useDispatch();
    if (contentType === 'step1') {
        return (
            <>
                <PassphraseHeading>
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_TITLE" />
                </PassphraseHeading>
                <Rows gap={8}>
                    <Card
                        paddingType="small"
                        label={
                            <Columns justifyContent="space-between">
                                <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_HINT" />
                                <TrezorLink
                                    type="hint"
                                    variant="nostyle"
                                    href={HELP_CENTER_PASSPHRASE_URL}
                                >
                                    <Button
                                        size="tiny"
                                        variant="info"
                                        iconAlignment="right"
                                        icon="EXTERNAL_LINK"
                                    >
                                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_HINT_LINK" />
                                    </Button>
                                </TrezorLink>
                            </Columns>
                        }
                    >
                        <Rows gap={12}>
                            <Text typographyStyle="highlight">
                                <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_UNUSED_WALLET_DESCRIPTION" />
                            </Text>

                            <Button
                                isFullWidth
                                variant="primary"
                                onClick={() => {
                                    setContentType('step2');
                                }}
                            >
                                <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_UNUSED_WALLET_BUTTON" />
                            </Button>
                        </Rows>
                    </Card>
                    <Card paddingType="small">
                        <Rows gap={12}>
                            <Text typographyStyle="highlight">
                                <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_WITH_FUNDS_DESCRIPTION" />
                            </Text>
                            <Button
                                isFullWidth
                                variant="tertiary"
                                onClick={() => {
                                    onCancel();
                                    // dispatch(
                                    //     createDeviceInstance({ device: device as AcquiredDevice }),
                                    // );
                                    // dispatch(authorizeDevice());
                                }}
                            >
                                <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_WITH_FUNDS_BUTTON" />
                            </Button>
                        </Rows>
                    </Card>
                </Rows>
            </>
        );
    }

    if (contentType === 'step2')
        return (
            <>
                <PassphraseHeading>
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_TITLE" />
                </PassphraseHeading>
                <PassphraseList>
                    <PassphraseItem>
                        <Icon icon="NEWSPAPER" size={16} />
                        <Text>
                            <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM1_DESCRIPTION" />
                        </Text>
                    </PassphraseItem>
                    <PassphraseItem>
                        <Icon icon="COPY" size={16} />
                        <Text>
                            <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM2_DESCRIPTION" />
                        </Text>
                    </PassphraseItem>
                    <PassphraseItem>
                        <Icon icon="HIDE" size={16} />
                        <Text>
                            <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM3_DESCRIPTION" />
                        </Text>
                    </PassphraseItem>
                </PassphraseList>

                <Warning>
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_WARNING" />
                </Warning>
                <Button
                    isFullWidth
                    variant="tertiary"
                    onClick={() => {
                        setContentType('step3');
                    }}
                    margin={{ top: 12 }}
                >
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_BUTTON" />
                </Button>
            </>
        );

    if (contentType === 'step3')
        return (
            <>
                <PassphraseHeading>
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP3_TITLE" />
                </PassphraseHeading>
                <Warning icon="INFO">
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP3_WARNING" />
                </Warning>
                <PassphraseTypeCard
                    type="hidden"
                    authConfirmation={authConfirmation}
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

    return null;
};

export const PassphraseWalletConfirmation = ({
    onCancel,
    authConfirmation,
    onSubmit,
    onDeviceOffer,
    device,
}: PassphraseWalletConfirmationProps) => {
    return (
        <SwitchDeviceRenderer isCancelable onCancel={onCancel}>
            <CardWithDevice onCancel={onCancel} device={device}>
                <PassphraseWalletConfirmationContent
                    authConfirmation={authConfirmation}
                    onSubmit={onSubmit}
                    onDeviceOffer={onDeviceOffer}
                    onCancel={onCancel}
                />
            </CardWithDevice>
        </SwitchDeviceRenderer>
    );
};
