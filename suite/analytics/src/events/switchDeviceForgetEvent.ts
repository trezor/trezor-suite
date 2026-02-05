import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {};

// @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
export const switchDeviceForgetEvent: EventDef<Attributes, EventType.SwitchDeviceForget> = {
    name: EventType.SwitchDeviceForget,
    descriptionTrigger: 'Switch device (upper-left corner) → Forget device',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {},
};
