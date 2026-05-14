import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export const deviceSettingsCheckBackupSupportEvent: EventDef<
    Record<never, never>,
    EventType.DeviceSettingsCheckBackupSupport
> = {
    name: EventType.DeviceSettingsCheckBackupSupport,
    descriptionTrigger: 'When is user redirected to the support screen during check backup flow.',
    changelog: [{ version: '25.8.1', notes: 'Added' }],
    attributes: {},
};
