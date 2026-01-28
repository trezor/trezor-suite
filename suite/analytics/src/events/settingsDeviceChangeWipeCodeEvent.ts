import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {};

export const settingsDeviceChangeWipeCodeEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceChangeWipeCode
> = {
    name: EventType.SettingsDeviceChangeWipeCode,
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'added' }],

    attributes: {},
};
