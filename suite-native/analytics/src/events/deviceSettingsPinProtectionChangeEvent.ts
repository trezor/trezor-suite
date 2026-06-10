import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type PinProtectionAction = 'enable' | 'change' | 'disable';

type Attributes = {
    action: AttributeDef<PinProtectionAction>;
};

export const deviceSettingsPinProtectionChangeEvent: EventDef<
    Attributes,
    EventType.DeviceSettingsPinProtectionChange
> = {
    name: EventType.DeviceSettingsPinProtectionChange,
    descriptionTrigger:
        'User clicks on a PIN protection button to enable, change, or disable PIN protection on the device from settings',
    changelog: [{ version: '24.11.1', notes: 'Added' }],
    attributes: {
        action: {
            changelog: [{ version: '24.11.1', notes: 'added' }],
            description:
                'The PIN protection action: `enable` to turn on PIN protection, `change` to modify existing PIN, `disable` to remove PIN protection',
        },
    },
};
