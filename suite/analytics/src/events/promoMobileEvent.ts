import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    platform: AttributeDef<'ios' | 'android'>;
};

export const promoMobileEvent: EventDef<Attributes, EventType.PromoMobile> = {
    name: EventType.PromoMobile,
    descriptionTrigger: 'User clicks on the mobile application promotional banner',
    changelog: [{ version: '23.5.2', notes: 'added' }],

    attributes: {
        platform: {
            description: 'The mobile platform: `ios` for Apple iOS or `android` for Android device',
            changelog: [{ version: '23.6.0', notes: 'added' }],
        },
    },
};
