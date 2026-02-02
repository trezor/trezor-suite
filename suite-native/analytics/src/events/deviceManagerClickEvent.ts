import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type DeviceManagerAction =
    | 'deviceItem'
    | 'portfolioTracker'
    | 'connectDeviceButton'
    | 'deviceSettings';

type Attributes = {
    action: AttributeDef<DeviceManagerAction>;
};

export const deviceManagerClickEvent: EventDef<Attributes, EventType.DeviceManagerClick> = {
    name: EventType.DeviceManagerClick,
    descriptionTrigger: 'Click on something within device manager / switcher',
    changelog: [{ version: '23.11.1', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '23.11.1', notes: 'added' }],
            description: 'The action performed',
        },
    },
};
