import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type DeviceSetupInfoLocation = 'untrustedReseller' | 'securitySeal';

type Attributes = {
    location: AttributeDef<DeviceSetupInfoLocation>;
};

export const deviceSetupInfoEvent: EventDef<Attributes, EventType.DeviceSetupInfo> = {
    name: EventType.DeviceSetupInfo,
    descriptionTrigger:
        'User clicks on an informational link to learn more about device authenticity or security during device setup',
    changelog: [{ version: '25.5.1', notes: 'added' }],
    attributes: {
        location: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description:
                'The topic of the info link clicked: `untrustedReseller` for information about reseller concerns, `securitySeal` for security seal information',
        },
    },
};
