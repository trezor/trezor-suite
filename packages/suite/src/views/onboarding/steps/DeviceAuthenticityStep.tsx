import { DeviceAuthenticityCheck } from '#src/components/suite/SecurityCheck/DeviceAuthenticityCheck';
import { useOnboarding } from '#src/hooks/suite/useOnboarding';

export const DeviceAuthenticityStep = () => {
    const { goToNextStep } = useOnboarding();

    return <DeviceAuthenticityCheck onSuccess={() => goToNextStep()} />;
};
