import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    remove: AttributeDef<boolean | null>;
};

export const settingsDeviceChangePinProtectionEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceChangePinProtection
> = {
    name: EventType.SettingsDeviceChangePinProtection,
    descriptionTrigger:
        'User changes PIN protection settings on the device from device security settings',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {
        remove: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
            description:
                'Whether PIN protection is being removed (`true`), added (`false`), or request was canceled (`null`)',
        },
    },
};
