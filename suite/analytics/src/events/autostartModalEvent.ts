import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'background-always' | 'background-now' | 'quit-always' | 'quit-now'>;
};

export const autostartModalEvent: EventDef<Attributes, EventType.AutostartModal> = {
    name: EventType.AutostartModal,
    descriptionTrigger:
        'A modal appears before quitting the app after using Connect popup, offering the user to leave the app running in the background',
    changelog: [{ version: '25.5.0', notes: 'added' }],

    attributes: {
        action: {
            description:
                "User's choice: `background-always` to always run in background, `background-now` to keep in background this time, `quit-always` to always quit, `quit-now` to quit this time",
            changelog: [{ version: '25.5.0', notes: 'added' }],
        },
    },
};
