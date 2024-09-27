import { Column, Card, Row, Button, Text, H3, Paragraph } from '@trezor/components';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';
import { Translation } from 'src/components/suite/Translation';
import { TrezorLink } from 'src/components/suite/TrezorLink';
import { ContentType } from './types';
import { Dispatch } from 'react';
import { spacings } from '@trezor/theme';

type PassphraseWalletConfirmationStep1Props = {
    setContentType: Dispatch<React.SetStateAction<ContentType>>;
    onRetry: () => void;
    'data-testid'?: string;
};

export const PassphraseWalletConfirmationStep1 = ({
    setContentType,
    onRetry,
    'data-testid': dataTest,
}: PassphraseWalletConfirmationStep1Props) => (
    <Column gap={spacings.sm} margin={{ top: spacings.xxs }} alignItems="stretch">
        <H3>
            <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_TITLE" />
        </H3>
        <Card
            paddingType="small"
            label={
                <Row
                    justifyContent="space-between"
                    margin={{ top: spacings.xxxs, bottom: spacings.xxs }}
                >
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_HINT" />
                    <TrezorLink type="hint" variant="nostyle" href={HELP_CENTER_PASSPHRASE_URL}>
                        <Button
                            size="tiny"
                            variant="info"
                            iconAlignment="right"
                            icon="arrowUpRight"
                            data-testid={dataTest}
                        >
                            <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_HINT_LINK" />
                        </Button>
                    </TrezorLink>
                </Row>
            }
        >
            <Column gap={spacings.sm}>
                <Paragraph typographyStyle="highlight">
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_UNUSED_WALLET_DESCRIPTION" />
                </Paragraph>
                <Button
                    isFullWidth
                    variant="primary"
                    onClick={() => {
                        setContentType('step2');
                    }}
                    data-testid="@passphrase-confirmation/step1-open-unused-wallet-button"
                >
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_UNUSED_WALLET_BUTTON" />
                </Button>
            </Column>
        </Card>
        <Card paddingType="small">
            <Column gap={spacings.md}>
                <Text typographyStyle="highlight">
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_WITH_FUNDS_DESCRIPTION" />
                </Text>
                <Button
                    isFullWidth
                    variant="tertiary"
                    onClick={onRetry}
                    data-testid="@passphrase-confirmation/step1-retry-button"
                >
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP1_OPEN_WITH_FUNDS_BUTTON" />
                </Button>
            </Column>
        </Card>
    </Column>
);
