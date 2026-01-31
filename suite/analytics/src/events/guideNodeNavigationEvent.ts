import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'page' | 'category'>;
    id: AttributeDef<string>;
};

export const guideNodeNavigationEvent: EventDef<Attributes, EventType.GuideNodeNavigation> = {
    name: EventType.GuideNodeNavigation,
    descriptionTrigger: 'Fired on navigation to categories and articles in Guide',
    changelog: [{ version: '1.11.0', notes: 'added' }],

    attributes: {
        type: {
            changelog: [{ version: '1.11.0', notes: 'added' }],
        },
        id: {
            changelog: [{ version: '1.11.0', notes: 'added' }],
        },
    },
};
