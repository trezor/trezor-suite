import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type DeviceModelInternal } from '@trezor/device-utils';

import { EventType } from '../constants';

type Attributes = {
    deviceModel: AttributeDef<DeviceModelInternal>;
};

export const deviceSetupStartedEvent: EventDef<Attributes, EventType.DeviceSetupStarted> = {
    name: EventType.DeviceSetupStarted,
    descriptionTrigger: 'User begins the initial setup process for a new device',
    changelog: [{ version: '25.12.1', notes: 'added' }],

    attributes: {
        deviceModel: {
            description:
                'The model identifier of the device being set up (e.g., T1B1 for Trezor One, T2T1 for Trezor Model T)',
            changelog: [{ version: '25.12.1', notes: 'added' }],
        },
    },
};
