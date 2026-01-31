import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<'back' | 'close' | 'category'>;
    id?: AttributeDef<string>;
};

export const guideHeaderNavigationEvent: EventDef<
    Attributes,
    EventType.GuideHeaderNavigation
> = {
    name: EventType.GuideHeaderNavigation,
    descriptionTrigger: 'Fired on navigation in Guide using Guide header elements',
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
