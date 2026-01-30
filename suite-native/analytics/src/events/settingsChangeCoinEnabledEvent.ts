import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { NetworkSymbol } from '@suite-common/wallet-config';

import { EventType } from '../constants';

type Attributes = {
    symbol: AttributeDef<NetworkSymbol>;
    value: AttributeDef<boolean>;
};

export const settingsChangeCoinEnabledEvent: EventDef<
    Attributes,
    EventType.SettingsChangeCoinEnabled
> = {
    name: EventType.SettingsChangeCoinEnabled,
    descriptionTrigger: 'On coin enabled/disabled in settings',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        symbol: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'The network symbol of the coin (`btc`, `eth`,…)',
        },
        value: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Whether the coin is enabled (`true`, `false`)',
        },
    },
};
