import { FirmwareUpdateActionTypes } from '@suite-actions/firmwareActions';
import { NewsletterActionTypes } from '@onboarding-types/newsletter';
import { RecoveryActionTypes } from '@onboarding-types/recovery';
import { OnboardingActionTypes } from '@onboarding-types/onboarding';
import { ConnectActionTypes } from '@onboarding-types/connect';

type Action =
    | FirmwareUpdateActionTypes
    | NewsletterActionTypes
    | RecoveryActionTypes
    | OnboardingActionTypes
    | ConnectActionTypes;

export default Action;
