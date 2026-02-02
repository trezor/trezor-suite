import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type DeviceSetupSecurityCheckEventLocation =
    | 'deviceLooksDifferent'
    | 'firmwareAlreadyInstalled'
    | 'untrustedReseller'
    | 'securitySeal'
    | 'packaging';

type Attributes = {
    location: AttributeDef<DeviceSetupSecurityCheckEventLocation>;
};

export const deviceSetupSecurityCheckEvent: EventDef<
    Attributes,
    EventType.DeviceSetupSecurityCheck
> = {
    name: EventType.DeviceSetupSecurityCheck,
    descriptionTrigger: 'User interacts with security check step in device setup.',
    changelog: [{ version: '1.0.0', notes: 'added' }],
    attributes: {
        location: { changelog: [{ version: '1.0.0', notes: 'added' }] },
    },
};
