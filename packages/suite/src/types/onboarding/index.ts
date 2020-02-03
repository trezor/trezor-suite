import { OnboardingActionTypes } from '@onboarding-actions/onboardingActions';
import { ConnectActionTypes } from '@onboarding-actions/connectActions';
import { NewsletterActionTypes } from '@onboarding-actions/newsletterActions';

export type OnboardingActions = OnboardingActionTypes | ConnectActionTypes | NewsletterActionTypes;

export interface Checkbox {
    value: boolean;
    label: string;
}
