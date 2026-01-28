import type { AttributeDef, EventDef } from '@suite-common/analytics-types';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'background-always' | 'background-now' | 'quit-always' | 'quit-now'>;
};

export const autostartModalEvent: EventDef<Attributes, EventType.AutostartModal> = {
    name: EventType.AutostartModal,
    descriptionTrigger:
        'appears before quitting the app if used connect popup, offers the user to leave the app to run in background',
    changelog: [{ version: '25.5.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '?', notes: 'added' }],
        },
    },
};
