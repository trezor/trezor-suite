import { DeviceAuthenticityCheck } from '../../../components/suite/SecurityCheck/DeviceAuthenticityCheck';
import { useOnboarding } from '../../../hooks/suite';

export const DeviceAuthenticityStep = () => {
    const { goToNextStep } = useOnboarding();

    return <DeviceAuthenticityCheck onSuccess={() => goToNextStep()} />;
};
