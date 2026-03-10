import { Translation } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';
import { STEP } from '@suite/onboarding';
import { Grid } from '@trezor/components';

import { OnboardingOption } from 'src/components/onboarding/OnboardingOption';
import { useLayoutSize, useOnboarding } from 'src/hooks/suite';

export const CreateOrRecoverStep = () => {
    const { goToNextStep, addPath, updateAnalytics } = useOnboarding();
    const { isBelowTablet } = useLayoutSize();

    return (
        <OnboardingCard
            iconName="wallet"
            heading={<Translation id="TR_WELCOME_TO_TREZOR_TEXT_WALLET_CREATION" />}
        >
            <Grid gap={24} columns={isBelowTablet ? 1 : 2}>
                <OnboardingOption
                    onClick={() => {
                        addPath(STEP.PATH_CREATE);
                        goToNextStep();
                        updateAnalytics({ seed: 'create' });
                    }}
                    data-testid="@onboarding/path-create-button"
                    iconName="plusCircle"
                    heading={<Translation id="TR_CREATE_WALLET" />}
                />
                <OnboardingOption
                    onClick={() => {
                        addPath(STEP.PATH_RECOVERY);
                        goToNextStep();
                        updateAnalytics({ seed: 'recovery' });
                    }}
                    data-testid="@onboarding/path-recovery-button"
                    iconName="trezorBackup"
                    heading={<Translation id="TR_RESTORE_EXISTING_WALLET" />}
                />
            </Grid>
        </OnboardingCard>
    );
};
