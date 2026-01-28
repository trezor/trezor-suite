import type { EventDef } from '@suite-common/analytics-types';

import { EventType } from '../constants';

type Attributes = {};

export const settingsDeviceDisableWipeCodeEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceDisableWipeCode
> = {
    name: EventType.SettingsDeviceDisableWipeCode,
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'added' }],

    attributes: {},
};
