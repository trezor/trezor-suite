import { TrezorDevice } from '@suite-common/suite-types';
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

interface PassphraseWalletConfirmationProps {
    onCancel: () => void;
    authConfirmation?: boolean;
    onSubmit: (value: string, passphraseOnDevice?: boolean) => void;
    onDeviceOffer: boolean;
    device: TrezorDevice;
}

type ContentType = 'step1' | 'step2' | 'step3';

export const PassphraseWalletConfirmation = ({
    onCancel,
    authConfirmation,
    onSubmit,
    onDeviceOffer,
    device,
}: PassphraseWalletConfirmationProps) => {
    const [contentType, setContentType] = useState<ContentType>('step1');

    const getContent = () => {
        if (contentType === 'step1') {
            return (
                <>
                    <PassphraseHeading>This passphrase wallet is empty </PassphraseHeading>
                    <Rows gap={8}>
                        <Card
                            paddingType="small"
                            label={
                                <Columns justifyContent="space-between">
                                    Learn how a passphrase works
                                    <Button
                                        size="tiny"
                                        variant="info"
                                        iconAlignment="right"
                                        icon="EXTERNAL_LINK"
                                    >
                                        Go
                                    </Button>
                                </Columns>
                            }
                        >
                            <Rows gap={12}>
                                <Text typographyStyle="highlight">
                                    Opening unused and knowingly empty passphrase wallet?
                                </Text>

                                <Button
                                    isFullWidth
                                    variant="primary"
                                    onClick={() => {
                                        setContentType('step2');
                                    }}
                                >
                                    Yes, open unused wallet
                                </Button>
                            </Rows>
                        </Card>
                        <Card paddingType="small">
                            <Rows gap={12}>
                                <Text typographyStyle="highlight">
                                    Expecting passphrase wallet with funds?
                                </Text>
                                <Button isFullWidth variant="tertiary">
                                    Try again
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
                    <PassphraseHeading>What to do with new passphrase?</PassphraseHeading>
                    <PassphraseList>
                        <PassphraseItem>
                            <Icon icon="NEWSPAPER" size={16} />
                            <Text>
                                Write your passphrase on a piece of paper and always keep it offline
                                (no photos, USB, internet)
                            </Text>
                        </PassphraseItem>
                        <PassphraseItem>
                            <Icon icon="COPY" size={16} />
                            <Text>Store it in a different place than your backup seed</Text>
                        </PassphraseItem>
                        <PassphraseItem>
                            <Icon icon="HIDE" size={16} />
                            <Text>Never share it with anyone, not even with Trezor support</Text>
                        </PassphraseItem>
                    </PassphraseList>

                    <Warning>No one can recover it, not even Trezor support</Warning>
                    <Button
                        isFullWidth
                        variant="tertiary"
                        onClick={() => {
                            setContentType('step3');
                        }}
                        margin={{ top: 12 }}
                    >
                        Got it, continue
                    </Button>
                </>
            );

        if (contentType === 'step3')
            return (
                <>
                    <PassphraseHeading>Confirm passphrase</PassphraseHeading>
                    <Warning icon="INFO">
                        Create an offline backup of your passphrase. It is irrecoverable, even by
                        Trezor support.
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
    };

    return (
        <SwitchDeviceRenderer isCancelable onCancel={onCancel}>
            {/* <TinyModal
                    heading={
                        !authConfirmation ? (
                            <Translation id="TR_ENTER_PASSPHRASE" />
                        ) : (
                            <Translation id="TR_CONFIRM_EMPTY_HIDDEN_WALLET" />
                        )
                    }
                    isCancelable
                    onCancel={onCancel}
                    onBackClick={authConfirmation ? onRecreate : undefined}
                    description={
                        !authConfirmation ? (
                            <Translation id="TR_UNLOCK" />
                        ) : (
                            <Translation id="TR_THIS_HIDDEN_WALLET_IS_EMPTY" />
                        )
                    }
                > */}
            <CardWithDevice onCancel={onCancel} device={device}>
                {getContent()}
            </CardWithDevice>
        </SwitchDeviceRenderer>
    );
};
