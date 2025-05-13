import { TrezorDevice } from '@suite-common/suite-types';
import { Banner, Button, Card, Column, H3, Icon, List, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { CardWithDevice } from '../../../../../views/suite/SwitchDevice/CardWithDevice';
import { SwitchDeviceModal } from '../../../../../views/suite/SwitchDevice/SwitchDeviceModal';
import { Translation } from '../../../Translation';

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
    <Column gap={spacings.sm} margin={{ top: spacings.xxs }}>
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
                <List.Item bulletComponent={<Icon name="eyeSlash" size={16} />}>
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_ITEM3_DESCRIPTION" />
                </List.Item>
            </List>
            <Banner margin={{ top: spacings.lg }}>
                <Text variant="warning" typographyStyle="callout">
                    <Translation id="TR_PASSPHRASE_WALLET_CONFIRMATION_STEP2_WARNING" />
                </Text>
            </Banner>
        </Card>

        <Button isFullWidth onClick={onNext} data-testid="@passphrase-confirmation/step2-button">
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
        <CardWithDevice
            onCancel={onCancel}
            device={device}
            onBackButtonClick={onBack}
            isFullHeaderVisible
        >
            <PassphraseWalletBestPracticesContent onNext={onNext} />
        </CardWithDevice>
    </SwitchDeviceModal>
);
