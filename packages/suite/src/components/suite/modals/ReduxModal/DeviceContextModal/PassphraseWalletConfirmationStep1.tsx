import { Column, Card, Row, Button, Text } from '@trezor/components';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';
import { Translation } from 'src/components/suite/Translation';
import { TrezorLink } from 'src/components/suite/TrezorLink';
import { PassphraseHeading } from './PassphraseHeading';
import { ContentType } from './types';
import { Dispatch } from 'react';

type PassphraseWalletConfirmationStep1Props = {
    setContentType: Dispatch<React.SetStateAction<ContentType>>;
    onRetry: () => void;
};

export const PassphraseWalletConfirmationStep1 = ({
    setContentType,
    onRetry,
}: PassphraseWalletConfirmationStep1Props) => (
    <>
        <PassphraseHeading>
            <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_TITLE" />
        </PassphraseHeading>
        <Column gap={8}>
            <Card
                paddingType="small"
                label={
                    <Row justifyContent="space-between">
                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_HINT" />
                        <TrezorLink type="hint" variant="nostyle" href={HELP_CENTER_PASSPHRASE_URL}>
                            <Button
                                size="tiny"
                                variant="info"
                                iconAlignment="right"
                                icon="EXTERNAL_LINK"
                            >
                                <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_HINT_LINK" />
                            </Button>
                        </TrezorLink>
                    </Row>
                }
            >
                <Column gap={12}>
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
                </Column>
            </Card>
            <Card paddingType="small">
                <Column gap={12}>
                    <Text typographyStyle="highlight">
                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_WITH_FUNDS_DESCRIPTION" />
                    </Text>
                    <Button isFullWidth variant="tertiary" onClick={onRetry}>
                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_WITH_FUNDS_BUTTON" />
                    </Button>
                </Column>
            </Card>
        </Column>
    </>
);
