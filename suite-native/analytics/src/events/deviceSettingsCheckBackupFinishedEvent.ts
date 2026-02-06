import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    success: AttributeDef<boolean>;
};

export const deviceSettingsCheckBackupFinishedEvent: EventDef<
    Attributes,
    // @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
    EventType.DeviceSettingsCheckBackupFinished
> = {
    name: EventType.DeviceSettingsCheckBackupFinished,
    descriptionTrigger:
        'User finished the on device backup check (he inputs all the seed words to the device).',
    changelog: [{ version: '25.8.1', notes: 'Added' }],
    attributes: {
        success: { changelog: [{ version: '25.8.1', notes: 'added' }] },
    },
};
