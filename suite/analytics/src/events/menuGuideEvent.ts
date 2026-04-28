import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const menuGuideEvent: EventDef<Attributes, EventType.MenuGuide> = {
    name: EventType.MenuGuide,
    descriptionTrigger:
        'Open guide by Lamp icon in bottom-right corner or from modal on mobile screen or by F1 key',
    changelog: [{ version: '1.11.0', notes: 'added' }],

    attributes: {},
};
