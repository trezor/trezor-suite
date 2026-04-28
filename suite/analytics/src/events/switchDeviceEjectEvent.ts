import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const switchDeviceEjectEvent: EventDef<Attributes, EventType.SwitchDeviceEject> = {
    name: EventType.SwitchDeviceEject,
    descriptionTrigger: 'Switch device (upper-left corner) → Eject device',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {},
};
