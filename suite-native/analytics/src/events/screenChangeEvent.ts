import { type AttributeDef, type EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    previousScreen: AttributeDef<string>;
    currentScreen: AttributeDef<string>;
};

export const screenChangeEvent: EventDef<Attributes, EventType.ScreenChange> = {
    name: EventType.ScreenChange,
    descriptionTrigger: 'On every screen change.',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        previousScreen: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'The name of the previous screen',
        },
        currentScreen: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'The name of the current screen',
        },
    },
};
