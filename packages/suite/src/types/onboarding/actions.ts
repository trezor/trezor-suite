<<<<<<< 9491b55e323dc2f22a1ba78273dd7a6d7f28dbf7
import { FirmwareUpdateActionTypes } from '@suite-actions/firmwareActions';
import { NewsletterActionTypes } from '@onboarding-types/newsletter';
import { RecoveryActionTypes } from '@onboarding-types/recovery';
import { OnboardingActionTypes } from '@onboarding-types/onboarding';
=======
import { FirmwareUpdateActionTypes } from '@suite/actions/settings/firmwareActions';
import { NewsletterActionTypes } from '@suite/types/onboarding/newsletter';
import { RecoveryActionTypes } from '@suite/types/onboarding/recovery';
import { OnboardingActionTypes } from '@suite/types/onboarding/onboarding';
>>>>>>> move actions
import { ConnectActionTypes } from '@onboarding-types/connect';

type Action =
    | FirmwareUpdateActionTypes
    | NewsletterActionTypes
    | RecoveryActionTypes
    | OnboardingActionTypes
    | ConnectActionTypes;

export default Action;
