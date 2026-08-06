import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type DeviceManagerAction =
    'deviceItem' | 'portfolioTracker' | 'connectDeviceButton' | 'deviceSettings';

type Attributes = {
    action: AttributeDef<DeviceManagerAction>;
};

export const switcherEvent: EventDef<Attributes, EventType.Switcher> = {
    name: EventType.Switcher,
    descriptionTrigger:
        'User interacts with the device switcher to select a device, access portfolio tracker, connect devices, or manage device settings',
    changelog: [{ version: '23.11.1', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '23.11.1', notes: 'added' }],
            description:
                '`connectDeviceButton` when selecting/connecting a regular device, `portfolioTracker` when selecting the portfolio tracker, `deviceSettings` to open device configuration. (`deviceItem` exists in the type but is currently never emitted.)',
        },
    },
};
