import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const settingsDeviceSetupWipeCodeEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceSetupWipeCode
> = {
    name: EventType.SettingsDeviceSetupWipeCode,
    descriptionTrigger: 'User initiates the setup process for a wipe code on their device',
    changelog: [{ version: '24.2.1', notes: 'added' }],

    attributes: {},
};
