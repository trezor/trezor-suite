import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type EjectOrigin = 'deviceManager' | 'deviceNotReadyModal';

type Attributes = {
    origin: AttributeDef<EjectOrigin>;
};

export const ejectDeviceClickEvent: EventDef<Attributes, EventType.EjectDeviceClick> = {
    name: EventType.EjectDeviceClick,
    descriptionTrigger: 'User ejects or disconnects a device from the application',
    changelog: [{ version: '23.11.1', notes: 'added' }],
    attributes: {
        origin: {
            description:
                'Where the eject action was triggered: `deviceManager` from the device manager interface, `deviceNotReadyModal` from the device not ready modal',
            changelog: [{ version: '23.11.1', notes: 'added' }],
        },
    },
};
