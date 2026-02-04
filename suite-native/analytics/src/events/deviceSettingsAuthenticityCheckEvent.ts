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
    descriptionTrigger: 'When DAC is finished.',
    changelog: [{ version: '24.12.1', notes: 'Added' }],
    attributes: {
        result: { changelog: [{ version: '24.12.1', notes: 'added' }] },
    },
};
