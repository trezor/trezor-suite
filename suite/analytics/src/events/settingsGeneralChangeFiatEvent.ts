import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    fiat: AttributeDef<string>;
};

export const settingsGeneralChangeFiatEvent: EventDef<
    Attributes,
    EventType.SettingsGeneralChangeFiat
> = {
    name: EventType.SettingsGeneralChangeFiat,
    descriptionTrigger: 'Settings > Application > LOCALIZATION > Fiat currency',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {
        fiat: {
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
    },
};
