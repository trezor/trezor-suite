import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    symbol: AttributeDef<string>;
    value: AttributeDef<boolean>;
};

export const settingsCoinsEvent: EventDef<Attributes, EventType.SettingsCoins> = {
    name: EventType.SettingsCoins,
    descriptionTrigger: 'Settings > Crypto > enable/disable coin',
    changelog: [{ version: '1.19.0', notes: 'added' }],

    attributes: {
        symbol: {
            changelog: [{ version: '1.19.0', notes: 'added' }],
        },
        value: {
            changelog: [{ version: '1.19.0', notes: 'added' }],
        },
    },
};
