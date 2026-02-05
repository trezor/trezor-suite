import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {};

// @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
export const switchDeviceEjectEvent: EventDef<Attributes, EventType.SwitchDeviceEject> = {
    name: EventType.SwitchDeviceEject,
    descriptionTrigger: 'Switch device (upper-left corner) → Eject device',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {},
};
