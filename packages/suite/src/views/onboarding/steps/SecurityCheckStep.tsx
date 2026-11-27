import { selectRecoveryStatus } from '@suite/recovery';
import { Card } from '@trezor/components';

import { ManualDeviceCheck } from '#src/components/suite/SecurityCheck/ManualDeviceCheck';
import { useOnboarding } from '#src/hooks/suite/useOnboarding';
import { useSelector } from '#src/hooks/suite/useSelector';

export const SecurityCheckStep = () => {
    const recoveryStatus = useSelector(selectRecoveryStatus);
    const { goToNextStep, rerun } = useOnboarding();
    const isRecoveryInProgress = recoveryStatus === 'in-progress';

    const handleSuccess = () => {
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
