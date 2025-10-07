import { OnboardingCard } from 'src/components/onboarding/OnboardingCard/OnboardingCard';
import { Translation } from 'src/components/suite/Translation';
import { useOnboarding } from 'src/hooks/suite';

export const DeviceDifferent = () => {
    const { resetOnboarding, enableOnboardingReducer } = useOnboarding();

    return (
        <OnboardingCard
            heading={<Translation id="ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_HEADING" />}
            description={
                <>
                    <Translation id="ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_P1" />
                    &nbsp;
                    <Translation id="ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_P2" />
                </>
            }
            innerActions={
                <OnboardingCard.Button
                    onClick={() => {
                        resetOnboarding();
                        enableOnboardingReducer(true);
                    }}
                    variant="tertiary"
                    data-testid="@onboarding/unexpected-state/is-same/start-over-button"
                >
                    <Translation id="TR_START_AGAIN" />
                </OnboardingCard.Button>
            }
        />
    );
};
