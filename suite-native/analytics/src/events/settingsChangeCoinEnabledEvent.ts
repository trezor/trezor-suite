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
    descriptionTrigger: 'User enables or disables a cryptocurrency network in mobile app settings',
    changelog: [{ version: '24.9.1', notes: 'added' }],

    attributes: {
        symbol: {
            changelog: [{ version: '24.9.1', notes: 'added' }],
            description:
                'The network symbol of the cryptocurrency being enabled or disabled (e.g., `btc`, `eth`, `ada`)',
        },
        value: {
            changelog: [{ version: '24.9.1', notes: 'added' }],
            description:
                '`true` if the cryptocurrency network is enabled (visible in app), `false` if disabled (hidden from app)',
        },
    },
};
