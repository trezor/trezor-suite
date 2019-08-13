import { FirmwareUpdateActionTypes } from '@suite/types/onboarding/firmwareUpdate';
import { NewsletterActionTypes } from '@suite/types/onboarding/newsletter';
import { RecoveryActionTypes } from '@suite/types/onboarding/recovery';
import { OnboardingActionTypes } from '@suite/types/onboarding/onboarding';
import { ConnectActionTypes } from '@onboarding-types/connect';

type Action =
    | FirmwareUpdateActionTypes
    | NewsletterActionTypes
    | RecoveryActionTypes
    | OnboardingActionTypes
    | ConnectActionTypes;

export default Action;
