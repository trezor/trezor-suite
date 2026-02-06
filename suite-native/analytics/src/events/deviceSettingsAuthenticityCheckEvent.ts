import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import type { DeviceAuthenticityCheckResult } from '../definitions';

type Attributes = {
    result: AttributeDef<DeviceAuthenticityCheckResult>;
};

export const deviceSettingsAuthenticityCheckEvent: EventDef<
    Attributes,
    // @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
    EventType.DeviceSettingsAuthenticityCheck
> = {
    name: EventType.DeviceSettingsAuthenticityCheck,
    descriptionTrigger: 'When DAC is finished.',
    changelog: [{ version: '24.12.1', notes: 'Added' }],
    attributes: {
        result: { changelog: [{ version: '24.12.1', notes: 'added' }] },
    },
};
