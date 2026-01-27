import type { EventDef } from '@suite-common/analytics-types';

import { EventType } from '../constants';

type Attributes = {};

export const menuGuideEvent: EventDef<Attributes, EventType.MenuGuide> = {
    name: EventType.MenuGuide,
    descriptionTrigger:
        'Open guide by Lamp icon in bottom-right corner or from modal on mobile screen or by F1 key',
    changelog: [{ version: '1.11.0', notes: 'added' }],

    attributes: {},
};
