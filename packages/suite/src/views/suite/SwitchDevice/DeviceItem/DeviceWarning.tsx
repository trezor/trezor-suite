import * as deviceUtils from '@suite-common/suite-utils';
import { Banner } from '@trezor/components';

import { Translation } from 'src/components/suite';
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
                <Banner
                    variant="warning"
                    rightContent={
                        <Banner.Button
                            onClick={onSolveIssueClick}
                            data-testid="@switch-device/solve-issue-button"
                            isDisabled={isLocked}
                        >
                            <Translation id="TR_SOLVE_ISSUE" />
                        </Banner.Button>
                    }
                >
                    {deviceStatusMessage && <Translation id={deviceStatusMessage} />}
                </Banner>
            )}
        </>
    );
};
