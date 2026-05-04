import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const settingsDeviceChangeWipeCodeEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceChangeWipeCode
> = {
    name: EventType.SettingsDeviceChangeWipeCode,
    descriptionTrigger: 'User modifies the wipe code on their device through settings',
    changelog: [{ version: '24.2.1', notes: 'added' }],

    attributes: {},
};
