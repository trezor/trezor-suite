import { NewsletterActionTypes } from '@onboarding-types/newsletter';
import { OnboardingActionTypes } from '@onboarding-types/onboarding';
import { ConnectActionTypes } from '@onboarding-types/connect';

type Action = NewsletterActionTypes | OnboardingActionTypes | ConnectActionTypes;

export default Action;
