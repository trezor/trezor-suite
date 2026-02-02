import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { DeviceModelInternal } from '@trezor/device-utils';

import { EventType } from '../constants';

type Attributes = {
    osName: AttributeDef<string>;
    deviceModel: AttributeDef<DeviceModelInternal | null>;
};

export const deviceSetupStartedEvent: EventDef<Attributes, EventType.DeviceSetupStarted> = {
    name: EventType.DeviceSetupStarted,
    descriptionTrigger: 'User starts device setup (onboarding).',
    changelog: [{ version: '1.0.0', notes: 'added' }],
    attributes: {
        osName: { changelog: [{ version: '1.0.0', notes: 'added' }] },
        deviceModel: { changelog: [{ version: '1.0.0', notes: 'added' }] },
    },
};
