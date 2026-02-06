import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    location: AttributeDef<string>;
};

export const deviceSettingsCheckBackupExitedEvent: EventDef<
    Attributes,
    // @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
    EventType.DeviceSettingsCheckBackupExited
> = {
    name: EventType.DeviceSettingsCheckBackupExited,
    descriptionTrigger: 'User exits check backup flow before finishing it.',
    changelog: [{ version: '25.8.1', notes: 'Added' }],
    attributes: {
        location: {
            changelog: [{ version: '25.8.1', notes: 'added' }],
            description: 'Location from where user exited the check backup flow.',
        },
    },
};
