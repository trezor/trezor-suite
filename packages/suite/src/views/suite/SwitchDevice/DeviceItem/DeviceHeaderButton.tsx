import * as deviceUtils from '@suite-common/suite-utils';

import { NotificationCard, Translation } from 'src/components/suite';
import { TrezorDevice } from 'src/types/suite';

interface DeviceHeaderButtonProps {
    needsAttention: boolean;
    device: TrezorDevice;
    onSolveIssueClick: () => void;
}

export const DeviceHeaderButton = ({
    device,
    needsAttention,
    onSolveIssueClick,
}: DeviceHeaderButtonProps) => {
    const deviceStatus = deviceUtils.getStatus(device);
    const deviceStatusMessage = deviceUtils.getDeviceNeedsAttentionMessage(deviceStatus);

    return (
        <>
            {needsAttention && (
                <NotificationCard
                    variant="warning"
                    button={{
                        children: <Translation id="TR_SOLVE_ISSUE" />,
                        onClick: onSolveIssueClick,
                        'data-test': `@switch-device/${device.path}/solve-issue-button`,
                    }}
                >
                    {deviceStatusMessage && <Translation id={deviceStatusMessage} />}
                </NotificationCard>
            )}
        </>
    );
};
