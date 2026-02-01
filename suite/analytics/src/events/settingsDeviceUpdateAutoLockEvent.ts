import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<number>;
};

export const settingsDeviceUpdateAutoLockEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceUpdateAutoLock
> = {
    name: EventType.SettingsDeviceUpdateAutoLock,
    descriptionTrigger: 'Settings > Device > CUSTOMIZATION > Auto-lock time (PIN required)',
    changelog: [{ version: '1.8.0', notes: 'added' }],

    attributes: {
        value: {
            changelog: [{ version: '1.8.0', notes: 'added' }],
            description: 'number in milliseconds',
        },
    },
};
