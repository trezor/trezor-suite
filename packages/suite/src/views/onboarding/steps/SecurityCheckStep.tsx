import { events, injectDesktopAnalytics } from '@suite/analytics';
import { selectRecoveryStatus } from '@suite/recovery';
import { selectDeviceModel } from '@suite-common/device';
import { Card } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { DeviceModelInternal } from '@trezor/device-utils';

import { ManualDeviceCheck } from '#src/components/suite/SecurityCheck/ManualDeviceCheck';
import { useOnboarding } from '#src/hooks/suite/useOnboarding';
import { useSelector } from '#src/hooks/suite/useSelector';

export const SecurityCheckStep = () => {
    const { analytics } = useServices(injectDesktopAnalytics);
    const recoveryStatus = useSelector(selectRecoveryStatus);
    const deviceModel = useSelector(selectDeviceModel) ?? DeviceModelInternal.UNKNOWN;
    const { goToNextStep, rerun } = useOnboarding();
    const isRecoveryInProgress = recoveryStatus === 'in-progress';

    const handleSuccess = () => {
        analytics.report(
            {
                type: events.deviceSetupStartedEvent.name,
                payload: { deviceModel },
            },
            { force: true },
        );

        if (isRecoveryInProgress) {
            rerun();
        } else {
            goToNextStep();
        }
    };

    return (
        <Card paddingType="large">
            <ManualDeviceCheck onSuccess={handleSuccess} />
        </Card>
    );
};
