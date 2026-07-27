import { Translation } from '@suite/intl';
import { IconCircle, List, Paragraph, Text } from '@trezor/components';
import { ClockIcon, ProhibitIcon } from '@trezor/icons';

export const FirmwareWarningsList = () => (
    <List bulletGap={12} gap={16}>
        <List.Item bulletComponent={<IconCircle icon={ClockIcon} intent="neutral" size={40} />}>
            <Paragraph>
                <Translation id="TR_FIRMWARE_UPDATE_TIME_WARNING" />
            </Paragraph>
        </List.Item>
        <List.Item bulletComponent={<IconCircle icon={ProhibitIcon} intent="neutral" size={40} />}>
            <Paragraph>
                <Translation
                    id="TR_FIRMWARE_DONT_CLOSE_APP"
                    values={{
                        highlight: chunks => <Text typographyStyle="body-md-strong">{chunks}</Text>,
                    }}
                />
            </Paragraph>
        </List.Item>
    </List>
);
