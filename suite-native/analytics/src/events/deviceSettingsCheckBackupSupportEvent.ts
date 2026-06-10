import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const deviceSettingsCheckBackupSupportEvent: EventDef<
    Record<never, never>,
    EventType.DeviceSettingsCheckBackupSupport
> = {
    name: EventType.DeviceSettingsCheckBackupSupport,
    descriptionTrigger:
        'User is redirected to the support screen during device backup verification flow when backup check cannot be completed',
    changelog: [{ version: '25.8.1', notes: 'Added' }],
    attributes: {},
};
