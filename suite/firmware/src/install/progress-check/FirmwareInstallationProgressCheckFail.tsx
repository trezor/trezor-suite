import { Translation } from '@suite/intl';
import { Button, Column, Divider, H2, Icon, List, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL } from '@trezor/urls';

// Url is shared with FW authenticity checks, the page is not precise for this check, but close enough.
// It's not worth creating a new page for this temporary measure.
const supportUrl = TREZOR_SUPPORT_FW_REVISION_CHECK_FAILED_URL;

type FirmwareInstallationProgressCheckFailProps = {
    toggleView: () => void;
};

export const FirmwareInstallationProgressCheckFail = ({
    toggleView,
}: FirmwareInstallationProgressCheckFailProps) => (
    <Column gap={spacings.xl} padding={{ top: spacings.xs }}>
        <Column gap={spacings.sm}>
            <H2>
                <Translation id="TR_DEVICE_COMPROMISED_HEADING" />
            </H2>
            <Paragraph intent="neutral" priority="secondary">
                <Translation id="TR_DEVICE_COMPROMISED_FIRMWARE_WONT_UPDATE_TEXT" />
            </Paragraph>
        </Column>
        <Divider />
        <List gap={spacings.xl}>
            <List.Item bulletComponent={<Icon size={24} intent="neutral" name="hand" />}>
                <Paragraph intent="neutral" priority="secondary">
                    <Translation id="TR_AVOID_USING_DEVICE" />
                </Paragraph>
            </List.Item>
            <List.Item bulletComponent={<Icon size={24} intent="neutral" name="chat" />}>
                <Paragraph intent="neutral" priority="secondary">
                    <Translation id="TR_USE_CHAT" values={{ b: chunks => <b>{chunks}</b> }} />
                </Paragraph>
            </List.Item>
        </List>
        <Row flexWrap="wrap" gap={spacings.xl} width="100%" margin={{ top: spacings.xxxxl }}>
            <Button
                intent="neutral"
                priority="secondary"
                onClick={toggleView}
                size="large"
                flex="1"
            >
                <Translation id="TR_BACK" />
            </Button>
            <Button href={`${supportUrl}#open-chat`} size="large" flex="1">
                <Translation id="TR_CONTACT_TREZOR_SUPPORT" />
            </Button>
        </Row>
    </Column>
);
