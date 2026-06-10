import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const switchDeviceForgetEvent: EventDef<Attributes, EventType.SwitchDeviceForget> = {
    name: EventType.SwitchDeviceForget,
    descriptionTrigger:
        'User clicks to forget a paired device from the device switcher (upper-left corner menu)',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {},
};
