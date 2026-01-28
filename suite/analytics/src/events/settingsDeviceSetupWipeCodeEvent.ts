import type { EventDef } from '@suite-common/analytics-types';

import { EventType } from '../constants';

type Attributes = {};

export const settingsDeviceSetupWipeCodeEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceSetupWipeCode
> = {
    name: EventType.SettingsDeviceSetupWipeCode,
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'added' }],

    attributes: {},
};
