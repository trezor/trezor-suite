import { TrezorLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { type TrezorDevice } from '@suite-common/suite-types';
import { Banner, Button, Column, H3, Icon, List, Paragraph, Text } from '@trezor/components';
import { CopyIcon, EyeSlashIcon, NewspaperIcon, WarningCircleIcon } from '@trezor/icons';
import { HELP_CENTER_PASSPHRASE_URL } from '@trezor/urls';

import { CardWithDevice } from 'src/views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from 'src/views/suite/SwitchDevice/SwitchDeviceModal';

type PassphraseWalletBestPracticesProps = {
    onCancel: () => void;
    onNext: () => void;
    onBack: () => void;
    device: TrezorDevice;
};

type PassphraseWalletBestPracticesContentProps = {
    onNext: () => void;
};

const PassphraseWalletBestPracticesContent = ({
    onNext,
}: PassphraseWalletBestPracticesContentProps) => (
    <Column gap={12}>
        <Column gap={16} padding={{ horizontal: 8 }}>
            <H3>
                <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_TITLE" />
            </H3>
            <List gap={12} bulletGap={16} typographyStyle="body-sm">
                <List.Item
                    bulletComponent={<Icon intent="info" as={WarningCircleIcon} size={16} />}
                >
                    <Paragraph intent="info" typographyStyle="body-sm-strong">
                        <Translation
                            id="TR_PASSPHRASE_DESCRIPTION_ITEM1"
                            values={{
                                a: text => (
                                    <TrezorLink href={HELP_CENTER_PASSPHRASE_URL}>
                                        {text}
                                    </TrezorLink>
                                ),
                            }}
                        />
                    </Paragraph>
                </List.Item>
                <List.Item bulletComponent={<Icon as={NewspaperIcon} size={16} />}>
                    <Paragraph intent="neutral" priority="secondary">
                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM1_DESCRIPTION" />
                    </Paragraph>
                </List.Item>
                <List.Item bulletComponent={<Icon as={CopyIcon} size={16} />}>
                    <Paragraph intent="neutral" priority="secondary">
                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM2_DESCRIPTION" />
                    </Paragraph>
                </List.Item>
                <List.Item bulletComponent={<Icon as={EyeSlashIcon} size={16} />}>
                    <Paragraph intent="neutral" priority="secondary">
                        <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM3_DESCRIPTION" />
                    </Paragraph>
                </List.Item>
            </List>
        </Column>
        <Banner
            margin={{ top: 12 }}
            description={
                <Text intent="warning" typographyStyle="body-sm-strong">
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_WARNING" />
                </Text>
            }
        />
        <Button width="100%" onClick={onNext} data-testid="@passphrase-confirmation/step2-button">
            <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_BUTTON" />
        </Button>
    </Column>
);

export const PassphraseWalletBestPractices = ({
    onCancel,
    onNext,
    onBack,
    device,
}: PassphraseWalletBestPracticesProps) => (
    <SwitchDeviceModal onCancel={onCancel}>
        <CardWithDevice onCancel={onCancel} device={device} onBackButtonClick={onBack}>
            <PassphraseWalletBestPracticesContent onNext={onNext} />
        </CardWithDevice>
    </SwitchDeviceModal>
);
