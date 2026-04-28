import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const switchDeviceRememberEvent: EventDef<Attributes, EventType.SwitchDeviceRemember> = {
    name: EventType.SwitchDeviceRemember,
    descriptionTrigger: 'Switch device (upper-left corner) → Remember device',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {},
};
