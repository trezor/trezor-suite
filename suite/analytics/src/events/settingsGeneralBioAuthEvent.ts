import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<boolean>;
};

export const settingsGeneralBioAuthEvent: EventDef<Attributes, EventType.SettingsGeneralBioAuth> = {
    name: EventType.SettingsGeneralBioAuth,
    descriptionTrigger: 'User enables or disables biometric authentication in app settings',
    changelog: [{ version: '25.9.0', notes: 'added' }],

    attributes: {
        value: {
            changelog: [{ version: '25.9.0', notes: 'added' }],
            description:
                'Whether biometric authentication is enabled (`true`) or disabled (`false`)',
        },
    },
};
