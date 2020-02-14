import { OnboardingActionTypes } from '@onboarding-actions/onboardingActions';
import { NewsletterActionTypes } from '@onboarding-actions/newsletterActions';

export type OnboardingActions = OnboardingActionTypes | NewsletterActionTypes;

export interface Checkbox {
    value: boolean;
    label: string;
}
