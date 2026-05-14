import type { EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = Record<never, never>;

export const settingsDeviceDisableWipeCodeEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceDisableWipeCode
> = {
    name: EventType.SettingsDeviceDisableWipeCode,
    descriptionTrigger: '?',
    changelog: [{ version: '?', notes: 'added' }],

    attributes: {},
};
