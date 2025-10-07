import { Flex } from '@trezor/components';

import { OnboardingCard } from 'src/components/onboarding/OnboardingCard/OnboardingCard';
import { OnboardingOption } from 'src/components/onboarding/OnboardingOption';
import { Translation } from 'src/components/suite/Translation';
import * as STEP from 'src/constants/onboarding/steps';
import { useLayoutSize, useOnboarding } from 'src/hooks/suite';

const CreateOrRecoverStep = () => {
    const { goToNextStep, addPath, updateAnalytics } = useOnboarding();
    const { isBelowTablet } = useLayoutSize();

    return (
        <OnboardingCard
            iconName="wallet"
            heading={<Translation id="TR_WELCOME_TO_TREZOR_TEXT_WALLET_CREATION" />}
        >
            <Flex gap={24} direction={isBelowTablet ? 'column' : 'row'}>
                <OnboardingOption
                    icon="plusCircle"
                    data-testid="@onboarding/path-create-button"
                    onClick={() => {
                        addPath(STEP.PATH_CREATE);
                        goToNextStep();
                        updateAnalytics({ seed: 'create' });
                    }}
                    heading={<Translation id="TR_CREATE_WALLET" />}
                />
                <OnboardingOption
                    icon="trezorBackup"
                    data-testid="@onboarding/path-recovery-button"
                    onClick={() => {
                        addPath(STEP.PATH_RECOVERY);
                        goToNextStep();
                        updateAnalytics({ seed: 'recovery' });
                    }}
                    heading={<Translation id="TR_RESTORE_EXISTING_WALLET" />}
                />
            </Flex>
        </OnboardingCard>
    );
};

export default CreateOrRecoverStep;
