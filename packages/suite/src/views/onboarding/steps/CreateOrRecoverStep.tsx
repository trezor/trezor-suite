import { useDispatch } from 'react-redux';

import { Translation } from '@suite/intl';
import {
    STEP,
    addOnboardingPath,
    goToNextStep,
    updateOnboardingAnalytics,
} from '@suite/onboarding';
import { OnboardingCard } from '@suite/onboarding-components';
import { Grid } from '@trezor/components';

import { OnboardingOption } from 'src/components/onboarding/OnboardingOption';
import { useLayoutSize } from 'src/hooks/suite';

export const CreateOrRecoverStep = () => {
    const dispatch = useDispatch();
    const { isBelowTablet } = useLayoutSize();

    return (
        <OnboardingCard
            iconName="wallet"
            heading={<Translation id="TR_WELCOME_TO_TREZOR_TEXT_WALLET_CREATION" />}
        >
            <Grid gap={24} columns={isBelowTablet ? 1 : 2}>
                <OnboardingOption
                    onClick={() => {
                        dispatch(addOnboardingPath(STEP.PATH_CREATE));
                        dispatch(goToNextStep());
                        dispatch(updateOnboardingAnalytics({ seed: 'create' }));
                    }}
                    data-testid="@onboarding/path-create-button"
                    iconName="plusCircle"
                    heading={<Translation id="TR_CREATE_WALLET" />}
                />
                <OnboardingOption
                    onClick={() => {
                        dispatch(addOnboardingPath(STEP.PATH_RECOVERY));
                        dispatch(goToNextStep());
                        dispatch(updateOnboardingAnalytics({ seed: 'recovery' }));
                    }}
                    data-testid="@onboarding/path-recovery-button"
                    iconName="trezorBackup"
                    heading={<Translation id="TR_RESTORE_EXISTING_WALLET" />}
                />
            </Grid>
        </OnboardingCard>
    );
};
