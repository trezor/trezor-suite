import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type DeviceSetupSecurityCheckLocation =
    | 'deviceLooksDifferent'
    | 'firmwareAlreadyInstalled'
    | 'untrustedReseller'
    | 'securitySeal'
    | 'packaging';

type Attributes = {
    location: AttributeDef<DeviceSetupSecurityCheckLocation>;
};

export const deviceSetupSecurityCheckEvent: EventDef<
    Attributes,
    // @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
    EventType.DeviceSetupSecurityCheck
> = {
    name: EventType.DeviceSetupSecurityCheck,
    descriptionTrigger: 'User has some concerns during security check.',
    changelog: [{ version: '25.5.1', notes: 'added' }],
    attributes: {
        location: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'Describes what was user unsure about and through which action exited the security check.',
        },
    },
};
