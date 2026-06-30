import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const menuGuideEvent: EventDef<Attributes, EventType.MenuGuide> = {
    name: EventType.MenuGuide,
    descriptionTrigger:
        'User opens Help & Support by clicking the bottom-right Help & Support entry point, pressing F1, or accessing Help & Support from a modal on mobile',
    changelog: [
        { version: '1.11.0', notes: 'added' },
        {
            version: '?',
            notes: 'Entry point changed to the mascot-style Help & Support button; description updated from "Guide"/lifebuoy wording',
        },
    ],

    attributes: {},
};
