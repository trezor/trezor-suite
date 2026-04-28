import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const settingsDeviceChangeWipeCodeEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceChangeWipeCode
> = {
    name: EventType.SettingsDeviceChangeWipeCode,
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'added' }],

    attributes: {},
};
