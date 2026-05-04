import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const deviceSettingsCheckBackupEnteredEvent: EventDef<
    Record<never, never>,
    EventType.DeviceSettingsCheckBackupEntered
> = {
    name: EventType.DeviceSettingsCheckBackupEntered,
    descriptionTrigger: 'User enters the check backup verification section in device settings',
    changelog: [{ version: '25.8.1', notes: 'added' }],
    attributes: {},
};
