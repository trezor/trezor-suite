import { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    previousScreen: AttributeDef<string>;
    currentScreen: AttributeDef<string>;
};

// @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
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
