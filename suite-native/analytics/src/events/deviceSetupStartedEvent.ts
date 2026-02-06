import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { DeviceModelInternal } from '@trezor/device-utils';

import { EventType } from '../constants';

type Attributes = {
    osName: AttributeDef<string>;
    deviceModel: AttributeDef<DeviceModelInternal | null>;
};

// @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
export const deviceSetupStartedEvent: EventDef<Attributes, EventType.DeviceSetupStarted> = {
    name: EventType.DeviceSetupStarted,
    descriptionTrigger: 'User enters the device onboarding flow.',
    changelog: [{ version: '25.5.1', notes: 'added' }],
    attributes: {
        osName: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Operating system name (ios or android)',
        },
        deviceModel: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Device model identifier',
        },
    },
};
