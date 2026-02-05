import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { DeviceModelInternal } from '@trezor/device-utils';

import { EventType } from '../constants';

type Attributes = {
    deviceModel: AttributeDef<DeviceModelInternal>;
};

// @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
export const deviceSetupStartedEvent: EventDef<Attributes, EventType.DeviceSetupStarted> = {
    name: EventType.DeviceSetupStarted,
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'added' }],

    attributes: {
        deviceModel: {
            changelog: [{ version: '?', notes: 'added' }],
        },
    },
};
