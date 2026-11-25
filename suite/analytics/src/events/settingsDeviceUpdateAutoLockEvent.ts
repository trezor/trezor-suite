import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<number>;
    powerSource: AttributeDef<'usb' | 'battery'>;
};

export const settingsDeviceUpdateAutoLockEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceUpdateAutoLock
> = {
    name: EventType.SettingsDeviceUpdateAutoLock,
    descriptionTrigger:
        'User changes the device auto-lock timeout setting in Settings > Device > Customization > Auto-lock time',
    changelog: [
        { version: '1.8.0', notes: 'added' },
        { version: '26.12.0', notes: 'added `powerSource` attribute' },
    ],

    attributes: {
        value: {
            description:
                'The auto-lock timeout duration in milliseconds (e.g., 60000 for 1 minute, 300000 for 5 minutes)',
            changelog: [{ version: '1.8.0', notes: 'added' }],
        },
        powerSource: {
            description:
                '`usb` for the timeout that applies while the device is connected to USB, `battery` for the one that applies while it is on battery or a wireless charger',
            changelog: [{ version: '26.12.0', notes: 'added' }],
        },
    },
};
