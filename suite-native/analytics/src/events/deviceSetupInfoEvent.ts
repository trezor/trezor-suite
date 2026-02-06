import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type DeviceSetupInfoLocation = 'untrustedReseller' | 'securitySeal';

type Attributes = {
    location: AttributeDef<DeviceSetupInfoLocation>;
};

// @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
export const deviceSetupInfoEvent: EventDef<Attributes, EventType.DeviceSetupInfo> = {
    name: EventType.DeviceSetupInfo,
    descriptionTrigger: 'User clicks on info link in device onboarding flow.',
    changelog: [{ version: '25.5.1', notes: 'added' }],
    attributes: {
        location: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: 'Type of info link clicked.',
        },
    },
};
