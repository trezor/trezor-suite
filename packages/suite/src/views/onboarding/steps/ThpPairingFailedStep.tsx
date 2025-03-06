import { OnboardingStepBox } from 'src/components/onboarding';
import { Translation } from 'src/components/suite';

import { ThpPairingFailedForFirmwareInstallation } from '../../../components/thp/ThpPairingFailedForFirmwareInstallation';

export const ThpPairingFailedStep = () => (
    <OnboardingStepBox
        image="CHECK_SHIELD"
        heading={<Translation id="TR_THP_INCORRECT_SECURITY_CODE" />}
        device={undefined}
        isActionAbortable={false}
    >
        <ThpPairingFailedForFirmwareInstallation />
    </OnboardingStepBox>
);
