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
    EventType.DeviceSetupSecurityCheck
> = {
    name: EventType.DeviceSetupSecurityCheck,
    descriptionTrigger:
        'During device onboarding, user expresses concerns about device authenticity or security during the security verification check',
    changelog: [{ version: '25.5.1', notes: 'added' }],
    attributes: {
        location: {
            changelog: [{ version: '25.5.1', notes: 'added' }],
            description: `The type of security concern raised during device setup:
- \`deviceLooksDifferent\`: device appearance concerns
- \`firmwareAlreadyInstalled\`: firmware was already present
- \`untrustedReseller\`: concerns about the seller
- \`securitySeal\`: security seal issue
- \`packaging\`: packaging concern`,
        },
    },
};
