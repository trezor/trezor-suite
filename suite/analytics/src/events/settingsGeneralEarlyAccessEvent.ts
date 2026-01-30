import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    allowPrerelease: AttributeDef<boolean>;
};

export const settingsGeneralEarlyAccessEvent: EventDef<
    Attributes,
    EventType.SettingsGeneralEarlyAccess
> = {
    name: EventType.SettingsGeneralEarlyAccess,
    descriptionTrigger:
        'Settings > Application > EXPERIMENTAL FEATURES > Early Access Program > Join/Leave > confirm choice. Triggered when user confirms choice of leaving or joining Early Access Program.',
    changelog: [{ version: '1.15.0', notes: 'added' }],

    attributes: {
        allowPrerelease: {
            changelog: [{ version: '1.15.0', notes: 'added' }],
            description: '`true` if app has Early Access Program active',
        },
    },
};
