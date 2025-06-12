import { OnboardingStepBox } from 'src/components/onboarding';
import { Translation } from 'src/components/suite';

import { ThpPairingStart } from '../../../components/thp/ThpPairingStart';

export const ThpPairingStartStep = () => (
    <OnboardingStepBox
        image="CHECK_SHIELD"
        heading={<Translation id="TR_THP_CREATE_SECURE_CONNECTION" />}
        device={undefined}
    >
        <ThpPairingStart />
    </OnboardingStepBox>
);
