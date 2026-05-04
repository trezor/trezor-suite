import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const switchDeviceEjectEvent: EventDef<Attributes, EventType.SwitchDeviceEject> = {
    name: EventType.SwitchDeviceEject,
    descriptionTrigger: 'User ejects a device from the device switcher (upper-left corner menu)',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {},
};
