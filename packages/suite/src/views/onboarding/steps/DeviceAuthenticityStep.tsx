import { DeviceAuthenticityCheck } from 'src/components/suite/SecurityCheck/DeviceAuthenticityCheck';
import { useOnboarding } from 'src/hooks/suite';

export const DeviceAuthenticityStep = () => {
    const { goToNextStep } = useOnboarding();

    return <DeviceAuthenticityCheck goToNext={() => goToNextStep()} />;
};
