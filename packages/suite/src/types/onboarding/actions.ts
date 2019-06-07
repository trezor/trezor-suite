import { FetchActionTypes } from '@suite/types/onboarding/fetch';
import { FirmwareUpdateActionTypes } from '@suite/types/onboarding/firmwareUpdate';
import { NewsletterActionTypes } from '@suite/types/onboarding/newsletter';
import { RecoveryActionTypes } from '@suite/types/onboarding/recovery';
import { OnboardingActionTypes } from '@suite/types/onboarding/onboarding';

type Action =
    | FetchActionTypes
    | FirmwareUpdateActionTypes
    | NewsletterActionTypes
    | RecoveryActionTypes
    | OnboardingActionTypes
    | Connect.ActionTypes;

export default Action;
