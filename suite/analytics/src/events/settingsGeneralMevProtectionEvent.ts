import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<boolean>;
};

export const settingsGeneralMevProtectionEvent: EventDef<
    Attributes,
    EventType.SettingsGeneralMevProtection
> = {
    name: EventType.SettingsGeneralMevProtection,
    descriptionTrigger:
        'User toggles MEV (Maximal Extractable Value) protection in application settings',
    changelog: [{ version: '25.10.0', notes: 'added' }],

    attributes: {
        value: {
            changelog: [{ version: '25.10.0', notes: 'added' }],
            description: 'Whether MEV protection is enabled (`true`) or disabled (`false`)',
        },
    },
};
