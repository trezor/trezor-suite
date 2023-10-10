import styled, { useTheme } from 'styled-components';

import * as deviceUtils from '@suite-common/suite-utils';
import { Icon } from '@trezor/components';

import { NotificationCard, Translation } from 'src/components/suite';
import { TrezorDevice } from 'src/types/suite';

const GrayNotificationCard = styled(NotificationCard)`
    background: ${({ theme }) => theme.BG_GREY};
    margin-bottom: 0;
`;
interface DeviceHeaderButtonProps {
    needsAttention: boolean;
    device: TrezorDevice;
    onSolveIssueClick: () => void;
    onDeviceSettingsClick: () => void;
}

export const DeviceHeaderButton = ({
    device,
    needsAttention,
    onDeviceSettingsClick,
    onSolveIssueClick,
}: DeviceHeaderButtonProps) => {
    const theme = useTheme();

    const deviceStatus = deviceUtils.getStatus(device);
    const deviceStatusMessage = deviceUtils.getDeviceNeedsAttentionMessage(deviceStatus);
    const isUnknown = device.type !== 'acquired';

    return (
        <>
            {needsAttention && (
                <GrayNotificationCard
                    variant="warning"
                    button={{
                        children: <Translation id="TR_SOLVE_ISSUE" />,
                        onClick: onSolveIssueClick,
                        'data-test': `@switch-device/${device.path}/solve-issue-button`,
                    }}
                >
                    {deviceStatusMessage && <Translation id={deviceStatusMessage} />}
                </GrayNotificationCard>
            )}
            {!needsAttention && !isUnknown && (
                // Device Settings button
                <Icon
                    useCursorPointer
                    size={24}
                    icon="SETTINGS"
                    color={theme.TYPE_LIGHT_GREY}
                    hoverColor={theme.TYPE_LIGHTER_GREY}
                    onClick={onDeviceSettingsClick}
                />
            )}
        </>
    );
};
