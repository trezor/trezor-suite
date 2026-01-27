import type { EventDef } from '@suite-common/analytics-types';

import { EventType } from '../constants';

type Attributes = {};

export const promoDesktopEvent: EventDef<Attributes, EventType.GetDesktopApp> = {
    name: EventType.GetDesktopApp,
    descriptionTrigger: 'A user clicks the desktop promo banner',
    changelog: [{ version: '23.5.2', notes: 'added' }],

    attributes: {},
};
