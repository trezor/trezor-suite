import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import type { DeviceAuthenticityCheckResult } from '../definitions';

type Attributes = {
    result: AttributeDef<DeviceAuthenticityCheckResult>;
};

export const deviceSettingsAuthenticityCheckEvent: EventDef<
    Attributes,
    EventType.DeviceSettingsAuthenticityCheck
> = {
    name: EventType.DeviceSettingsAuthenticityCheck,
    descriptionTrigger:
        'Device Authenticity Check (DAC) verification completes to verify if the device firmware is authentic',
    changelog: [{ version: '24.12.1', notes: 'Added' }],
    attributes: {
        result: {
            changelog: [{ version: '24.12.1', notes: 'added' }],
            description:
                'The result of the authenticity check: `successful`, `compromised`, `cancelled`, or `failed`',
        },
    },
};
