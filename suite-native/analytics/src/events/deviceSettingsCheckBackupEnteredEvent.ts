import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const deviceSettingsCheckBackupEnteredEvent: EventDef<
    {},
    // @ts-expect-error deprecated event name (see `EventName` in `suite-common/analytics/src/eventDefinition.ts`)
    EventType.DeviceSettingsCheckBackupEntered
> = {
    name: EventType.DeviceSettingsCheckBackupEntered,
    descriptionTrigger: 'User enters CHECK BACKUP device settings section.',
    changelog: [{ version: '25.8.1', notes: 'Added' }],
    attributes: {},
};
