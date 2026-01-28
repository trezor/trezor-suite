import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    platform: AttributeDef<'ios' | 'android'>;
};

export const promoMobileEvent: EventDef<Attributes, EventType.GetMobileApp> = {
    name: EventType.GetMobileApp,
    descriptionTrigger: 'A user clicks the mobile app promo banner',
    changelog: [{ version: '23.5.2', notes: 'added' }],

    attributes: {
        platform: {
            changelog: [{ version: '23.6.0', notes: 'added' }],
        },
    },
};
