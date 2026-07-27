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
    descriptionTrigger:
        'User changes the device auto-lock timeout setting in Settings > Device > Customization > Auto-lock time',
    changelog: [{ version: '1.8.0', notes: 'added' }],

    attributes: {
        value: {
            description:
                'The auto-lock timeout duration in milliseconds (e.g., 60000 for 1 minute, 300000 for 5 minutes)',
            changelog: [{ version: '1.8.0', notes: 'added' }],
        },
    },
};
