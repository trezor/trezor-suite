import { Button, Text, Banner, Card, Icon, H3, Column, List } from '@trezor/components';
import { Translation } from 'src/components/suite/Translation';
import { ContentType } from './types';
import { Dispatch } from 'react';
import { spacings } from '@trezor/theme';

type PassphraseWalletConfirmationStep2Props = {
    setContentType: Dispatch<React.SetStateAction<ContentType>>;
};

export const PassphraseWalletConfirmationStep2 = ({
    setContentType,
}: PassphraseWalletConfirmationStep2Props) => (
    <Column gap={spacings.sm} margin={{ top: spacings.xxs }} alignItems="stretch">
        <H3>
            <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_TITLE" />
        </H3>
        <Card paddingType="small">
            <List gap={spacings.sm} bulletGap={spacings.md} typographyStyle="hint">
                <List.Item bulletComponent={<Icon name="newspaper" size={16} />}>
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM1_DESCRIPTION" />
                </List.Item>
                <List.Item bulletComponent={<Icon name="copy" size={16} />}>
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM2_DESCRIPTION" />
                </List.Item>
                <List.Item bulletComponent={<Icon name="hide" size={16} />}>
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM3_DESCRIPTION" />
                </List.Item>
            </List>
            <Banner margin={{ top: spacings.lg }}>
                <Text variant="warning" typographyStyle="callout">
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_WARNING" />
                </Text>
            </Banner>
        </Card>

        <Button
            isFullWidth
            onClick={() => {
                setContentType('step3');
            }}
            data-testid="@passphrase-confirmation/step2-button"
        >
            <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_BUTTON" />
        </Button>
    </Column>
);
