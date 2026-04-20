import { Translation } from '@suite/intl';
import { Button, Column, Divider, H2, Image, Paragraph, Row } from '@trezor/components';
import { borders, spacings } from '@trezor/theme';

// only relevant for bootloader 1.12.1
const imageAltText = `Install new firmware?
Never do this without your recovery card!
Abort. Continue.`;

type FirmwareInstallationProgressCheckProps = {
    handleDismiss: () => void;
    toggleView: () => void;
};

export const FirmwareInstallationProgressCheckPrompt = ({
    handleDismiss,
    toggleView,
}: FirmwareInstallationProgressCheckProps) => (
    <Column gap={spacings.xl}>
        <Column gap={spacings.md} padding={{ top: spacings.xs }}>
            <H2>
                <Translation id="TR_FIRMWARE_INSTALLATION_PROGRESS_CHECK_HEADING" />
            </H2>
            <Divider margin={{ vertical: spacings.xl }} />
            <Paragraph>
                <Translation id="TR_FIRMWARE_INSTALLATION_PROGRESS_CHECK_TEXT_BEFORE_IMAGE" />
            </Paragraph>
            <div>
                <Image
                    image="CONFIRM_FW_INSTALLATION_SCREEN_T1B1"
                    alt={imageAltText}
                    borderRadius={borders.radii.xxs}
                />
            </div>
            <Paragraph>
                <Translation id="TR_FIRMWARE_INSTALLATION_PROGRESS_CHECK_TEXT_AFTER_IMAGE" />
            </Paragraph>
        </Column>
        <Row
            alignItems="stretch"
            flexWrap="wrap"
            gap={spacings.xl}
            width="100%"
            margin={{ top: spacings.xxxxl }}
        >
            <Button intent="neutral" priority="secondary" onClick={toggleView} flex="1">
                <Translation id="TR_FIRMWARE_INSTALLATION_PROGRESS_CHECK_NO_BUTTON" />
            </Button>
            <Button onClick={handleDismiss} flex="1">
                <Translation id="TR_FIRMWARE_INSTALLATION_PROGRESS_CHECK_YES_BUTTON" />
            </Button>
        </Row>
    </Column>
);
