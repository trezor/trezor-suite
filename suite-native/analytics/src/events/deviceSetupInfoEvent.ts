import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type DeviceSetupInfoEventLocation = 'untrustedReseller' | 'securitySeal';

type Attributes = {
    location: AttributeDef<DeviceSetupInfoEventLocation>;
};

export const deviceSetupInfoEvent: EventDef<Attributes, EventType.DeviceSetupInfo> = {
    name: EventType.DeviceSetupInfo,
    descriptionTrigger: 'User views info (untrusted reseller, security seal) in device setup.',
    changelog: [{ version: '1.0.0', notes: 'added' }],
    attributes: {
        location: { changelog: [{ version: '1.0.0', notes: 'added' }] },
    },
};
