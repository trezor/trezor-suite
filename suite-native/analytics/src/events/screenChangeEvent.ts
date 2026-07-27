import { type AttributeDef, type EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    previousScreen: AttributeDef<string>;
    currentScreen: AttributeDef<string>;
};

export const screenChangeEvent: EventDef<Attributes, EventType.ScreenChange> = {
    name: EventType.ScreenChange,
    descriptionTrigger: 'User navigates to a different screen in the application',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        previousScreen: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'The name or identifier of the screen the user is navigating away from',
        },
        currentScreen: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'The name or identifier of the screen the user is navigating to',
        },
    },
};
