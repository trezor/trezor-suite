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
    descriptionTrigger: 'On changing whether network is enabled or not',
    changelog: [{ version: '24.9.1', notes: 'added' }],

    attributes: {
        symbol: {
            changelog: [{ version: '24.9.1', notes: 'added' }],
            description: 'The network symbol of the coin',
        },
        value: {
            changelog: [{ version: '24.9.1', notes: 'added' }],
            description: 'Whether the coin is enabled',
        },
    },
};
