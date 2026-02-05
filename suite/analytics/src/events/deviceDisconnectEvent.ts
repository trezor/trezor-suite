import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {};

// @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
export const deviceDisconnectEvent: EventDef<Attributes, EventType.DeviceDisconnect> = {
    name: EventType.DeviceDisconnect,
    descriptionTrigger: 'Fired when device is ejected.',
    changelog: [{ version: '1.5.0', notes: 'added' }],

    attributes: {},
};
