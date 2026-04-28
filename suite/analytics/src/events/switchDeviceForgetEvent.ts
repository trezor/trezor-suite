import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const switchDeviceForgetEvent: EventDef<Attributes, EventType.SwitchDeviceForget> = {
    name: EventType.SwitchDeviceForget,
    descriptionTrigger: 'Switch device (upper-left corner) → Forget device',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {},
};
