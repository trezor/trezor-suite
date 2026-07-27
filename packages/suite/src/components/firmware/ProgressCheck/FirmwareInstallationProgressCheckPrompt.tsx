import { Translation } from '@suite/intl';
import { Button, Column, Divider, H2, Image, Paragraph, Row } from '@trezor/components';

import { SecurityCheckLayout } from '../../suite/SecurityCheck/SecurityCheckLayout';

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
    <SecurityCheckLayout>
        <Column gap={16} padding={{ top: 8 }}>
            <H2>
                <Translation id="TR_FIRMWARE_INSTALLATION_PROGRESS_CHECK_HEADING" />
            </H2>
            <Divider margin={{ vertical: 24 }} />
            <Paragraph>
                <Translation id="TR_FIRMWARE_INSTALLATION_PROGRESS_CHECK_TEXT_BEFORE_IMAGE" />
            </Paragraph>
            <div>
                <Image
                    image="CONFIRM_FW_INSTALLATION_SCREEN_T1B1"
                    alt={imageAltText}
                    borderRadius={4}
                />
            </div>
            <Paragraph>
                <Translation id="TR_FIRMWARE_INSTALLATION_PROGRESS_CHECK_TEXT_AFTER_IMAGE" />
            </Paragraph>
        </Column>
        <Row alignItems="stretch" flexWrap="wrap" gap={24} width="100%" margin={{ top: 48 }}>
            <Button intent="neutral" priority="secondary" onClick={toggleView} flex="1">
                <Translation id="TR_FIRMWARE_INSTALLATION_PROGRESS_CHECK_NO_BUTTON" />
            </Button>
            <Button onClick={handleDismiss} flex="1">
                <Translation id="TR_FIRMWARE_INSTALLATION_PROGRESS_CHECK_YES_BUTTON" />
            </Button>
        </Row>
    </SecurityCheckLayout>
);
