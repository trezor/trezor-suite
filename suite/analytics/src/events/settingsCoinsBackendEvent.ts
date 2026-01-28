import type { AttributeDef, EventDef } from '@suite-common/analytics-types';

import { EventType } from '../constants';

type Attributes = {
    symbol: AttributeDef<string>;
    type: AttributeDef<
        | 'blockbook'
        | 'electrum'
        | 'ripple'
        | 'blockfrost'
        | 'coinjoin'
        | 'default'
        | 'solana'
        | 'stellar'
        | 'evm-rpc'
    >;
    totalRegular: AttributeDef<number>;
    totalOnion: AttributeDef<number>;
};

export const settingsCoinsBackendEvent: EventDef<Attributes, EventType.SettingsCoinsBackend> = {
    name: EventType.SettingsCoinsBackend,
    descriptionTrigger: 'Settings > Coins > Coin settings > backend change',
    changelog: [
        { version: '1.17.0', notes: 'added' },
        {
            version: '1.19.0',
            notes: 'Renamed from `settings/coin-backend` to `settings/coins/backend`',
        },
    ],

    attributes: {
        symbol: {
            changelog: [{ version: '?', notes: 'added' }],
        },
        type: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
            description: `
            - **default**: user is using servers provided by Trezor (**default**)
- **electrum:** user changed backend to **electrum**, available only for Bitcoin
- **blockbook, blockfrost, ripple**: user changed backend to **custom** server`,
        },
        totalRegular: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
            description:
                'Make sense only for type custom and electrum backend. Otherwise, it will be 0.',
        },
        totalOnion: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
            description:
                'Make sense only for type custom and electrum backend. Otherwise, it will be 0.',
        },
    },
};
