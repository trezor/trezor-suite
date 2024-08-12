import * as deviceUtils from '@suite-common/suite-utils';

import { NotificationCard, Translation } from 'src/components/suite';
import { TrezorDevice } from 'src/types/suite';
import { useDevice } from 'src/hooks/suite';

interface DeviceWarningProps {
    needsAttention: boolean;
    device: TrezorDevice;
    onSolveIssueClick: () => void;
}

export const DeviceWarning = ({
    device,
    needsAttention,
    onSolveIssueClick,
}: DeviceWarningProps) => {
    const deviceStatus = deviceUtils.getStatus(device);
    const deviceStatusMessage = deviceUtils.getDeviceNeedsAttentionMessage(deviceStatus);
    const isLocked = useDevice().isLocked(true);

    return (
        <>
            {needsAttention && (
                <NotificationCard
                    variant="warning"
                    button={{
                        children: <Translation id="TR_SOLVE_ISSUE" />,
                        onClick: onSolveIssueClick,
                        'data-testid': `@switch-device/${device.path}/solve-issue-button`,
                        isDisabled: isLocked,
                    }}
                >
                    {deviceStatusMessage && <Translation id={deviceStatusMessage} />}
                </NotificationCard>
            )}
        </>
    );
};
