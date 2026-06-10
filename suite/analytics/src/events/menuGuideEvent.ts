import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const menuGuideEvent: EventDef<Attributes, EventType.MenuGuide> = {
    name: EventType.MenuGuide,
    descriptionTrigger:
        'User opens the in-app Guide by clicking the lifebuoy icon in the bottom-right corner, pressing F1 key, or accessing it from a modal on mobile',
    changelog: [{ version: '1.11.0', notes: 'added' }],

    attributes: {},
};
