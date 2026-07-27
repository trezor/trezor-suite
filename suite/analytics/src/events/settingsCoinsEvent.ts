import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    symbol: AttributeDef<string>;
    value: AttributeDef<boolean>;
};

export const settingsCoinsEvent: EventDef<Attributes, EventType.SettingsCoins> = {
    name: EventType.SettingsCoins,
    descriptionTrigger:
        'User enables or disables visibility of a cryptocurrency coin in Settings > Crypto > Coin settings',
    changelog: [{ version: '1.19.0', notes: 'added' }],

    attributes: {
        symbol: {
            description:
                'The blockchain network or cryptocurrency symbol being toggled (e.g., `btc`, `eth`)',
            changelog: [{ version: '1.19.0', notes: 'added' }],
        },
        value: {
            description: 'Whether the coin is enabled (`true`) or disabled (`false`)',
            changelog: [{ version: '1.19.0', notes: 'added' }],
        },
    },
};
