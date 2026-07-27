import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    hasAtLeastOneRememberedWallet: AttributeDef<boolean>;
};

export const promoReferralButtonEvent: EventDef<Attributes, EventType.PromoReferralButton> = {
    name: EventType.PromoReferralButton,
    descriptionTrigger:
        'User clicks the referral program promotion banner/button on the dashboard to view earning opportunities',
    changelog: [{ version: '25.9.0', notes: 'added' }],

    attributes: {
        hasAtLeastOneRememberedWallet: {
            description:
                'Whether the user has at least one wallet saved/remembered (`true`) or no wallets are remembered (`false`)',
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
    },
};
