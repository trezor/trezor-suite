import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<string>;
    version: AttributeDef<string>;
};

export const transportTypeEvent: EventDef<Attributes, EventType.TransportType> = {
    name: EventType.TransportType,
    descriptionTrigger: 'On app start (when TRANSPORT.START action is fired)',
    possibleImprovements: 'Possible improvement: could be part of Suite ready',
    changelog: [
        {
            version: '1.0.0',
            notes: 'added',
        },
    ],

    attributes: {
        type: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description: 'WebUsbPlugin, bridge',
        },
        version: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description: 'Version in server format',
        },
    },
};
