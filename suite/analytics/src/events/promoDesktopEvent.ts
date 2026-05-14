import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const promoDesktopEvent: EventDef<Attributes, EventType.PromoDesktop> = {
    name: EventType.PromoDesktop,
    descriptionTrigger: 'A user clicks the desktop promo banner',
    changelog: [{ version: '23.5.2', notes: 'added' }],

    attributes: {},
};
