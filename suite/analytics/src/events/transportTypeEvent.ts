import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    type: AttributeDef<string>;
    version: AttributeDef<string>;
};

export const transportTypeEvent: EventDef<Attributes, EventType.TransportType> = {
    name: EventType.TransportType,
    descriptionTrigger:
        'Application initializes and detects the available device transport type (WebUSB, bridge, or other)',
    possibleImprovements: 'Possible improvement: could be part of Suite ready',
    changelog: [
        {
            version: '1.0.0',
            notes: 'added',
        },
    ],

    attributes: {
        type: {
            description:
                'The device transport name (e.g., `BridgeTransport`, `WebUsbTransport`, `NodeUsbTransport`)',
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
        version: {
            description:
                'The transport/bridge server version in format (e.g., `2.0.30` for bridge)',
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
    },
};
