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
    descriptionTrigger:
        'User changes the fiat currency for price display in Settings > Application > Localization > Fiat currency',
    changelog: [{ version: '1.0.0', notes: 'added' }],

    attributes: {
        fiat: {
            description:
                'The selected fiat currency code (e.g., `usd` for US Dollar, `eur` for Euro, `czk` for Czech Koruna)',
            changelog: [{ version: '1.0.0', notes: 'added' }],
        },
    },
};
