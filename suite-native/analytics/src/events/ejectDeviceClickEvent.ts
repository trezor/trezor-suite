import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type EjectOrigin = 'deviceManager' | 'deviceNotReadyModal';

type Attributes = {
    origin: AttributeDef<EjectOrigin>;
};

export const ejectDeviceClickEvent: EventDef<Attributes, EventType.EjectDeviceClick> = {
    name: EventType.EjectDeviceClick,
    descriptionTrigger: 'Eject device from anywhere.',
    changelog: [{ version: '23.11.1', notes: 'Added' }],
    attributes: {
        origin: { changelog: [{ version: '23.11.1', notes: 'added' }] },
    },
};
