import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const deviceDisconnectEvent: EventDef<Attributes, EventType.DeviceDisconnect> = {
    name: EventType.DeviceDisconnect,
    descriptionTrigger: 'Fired when device is ejected.',
    changelog: [{ version: '1.5.0', notes: 'added' }],

    attributes: {},
};
