import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    value: AttributeDef<boolean>;
};

export const settingsGeneralBioAuthEvent: EventDef<Attributes, EventType.SettingsGeneralBioAuth> = {
    name: EventType.SettingsGeneralBioAuth,
    descriptionTrigger: 'User set bio auth in App settings',
    changelog: [{ version: '25.9.0', notes: 'added' }],

    attributes: {
        value: {
            changelog: [{ version: '25.9.0', notes: 'added' }],
        },
    },
};
