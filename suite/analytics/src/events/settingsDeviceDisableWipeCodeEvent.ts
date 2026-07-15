import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const settingsDeviceDisableWipeCodeEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceDisableWipeCode
> = {
    name: EventType.SettingsDeviceDisableWipeCode,
    descriptionTrigger: 'User disables or removes the wipe code from their device through settings',
    changelog: [{ version: '24.2.1', notes: 'added' }],

    attributes: {},
};
