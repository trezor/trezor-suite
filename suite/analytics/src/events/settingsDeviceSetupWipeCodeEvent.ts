import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const settingsDeviceSetupWipeCodeEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceSetupWipeCode
> = {
    name: EventType.SettingsDeviceSetupWipeCode,
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'added' }],

    attributes: {},
};
