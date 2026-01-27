import type { AttributeDef, EventDef } from '@suite-common/analytics-types';

import { EventType } from '../constants';

type Attributes = {
    hasAtLeastOneRememberedWallet: AttributeDef<boolean>;
};

export const promoReferralButtonEvent: EventDef<Attributes, EventType.ReferralButton> = {
    name: EventType.ReferralButton,
    descriptionTrigger: 'User clicks `Earn $20 per Referral` on dashboard',
    changelog: [{ version: '25.9.0', notes: 'added' }],

    attributes: {
        hasAtLeastOneRememberedWallet: {
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
    },
};
