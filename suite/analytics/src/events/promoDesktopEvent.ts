import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    placement?: AttributeDef<'footer' | 'settings'>;
};

export const promoDesktopEvent: EventDef<Attributes, EventType.PromoDesktop> = {
    name: EventType.PromoDesktop,
    descriptionTrigger: 'A user clicks the desktop promo banner',
    changelog: [{ version: '23.5.2', notes: 'added' }],

    attributes: {
        placement: {
            changelog: [
                {
                    version: '26.6.0',
                    notes: 'added — distinguishes the dashboard footer CTA from the settings banner CTA',
                },
            ],
        },
    },
};
