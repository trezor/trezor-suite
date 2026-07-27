import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const switchDeviceRememberEvent: EventDef<Attributes, EventType.SwitchDeviceRemember> = {
    name: EventType.SwitchDeviceRemember,
    descriptionTrigger:
        'User clicks to remember a paired device in the device switcher (upper-left corner menu)',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {},
};
