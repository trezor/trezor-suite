import type { AttributeDef, EventDef } from '@suite-common/analytics-types';

import { EventType } from '../constants';

type Attributes = {
    remove: AttributeDef<boolean | null>;
};

export const settingsDeviceChangePinProtectionEvent: EventDef<
    Attributes,
    EventType.SettingsDeviceChangePinProtection
> = {
    name: EventType.SettingsDeviceChangePinProtection,
    descriptionTrigger: 'Settings > Device > SECURITY > PIN',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {
        remove: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
    },
};
