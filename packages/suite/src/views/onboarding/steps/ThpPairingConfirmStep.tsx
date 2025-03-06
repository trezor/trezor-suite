import { OnboardingStepBox } from 'src/components/onboarding';
import { Translation } from 'src/components/suite';

import { ThpConfirmConnection } from '../../../components/thp/ThpConfirmConnection';

export const ThpPairingConfirmStep = () => (
    <OnboardingStepBox
        image="CHECK_SHIELD"
        heading={<Translation id="TR_THP_CREATE_SECURE_CONNECTION" />}
        device={undefined}
        isActionAbortable={false}
    >
        <ThpConfirmConnection />
    </OnboardingStepBox>
);
