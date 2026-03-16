import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type DeviceModelInternal } from '@trezor/device-utils';

import { EventType } from '../constants';

type Attributes = {
    deviceModel: AttributeDef<DeviceModelInternal>;
};

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
