import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type DeviceModelInternal } from '@trezor/device-utils';

import { EventType } from '../constants';

type Attributes = {
    osName: AttributeDef<string>;
    deviceModel: AttributeDef<DeviceModelInternal | null>;
};

export const deviceSetupStartedEvent: EventDef<Attributes, EventType.DeviceSetupStarted> = {
    name: EventType.DeviceSetupStarted,
    descriptionTrigger:
        'User initiates the device setup and onboarding flow for a new or recovered device',
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
