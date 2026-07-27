import type { AttributeDef, EventDef } from '@suite-common/analytics';

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
    descriptionTrigger:
        'User changes the blockchain backend connection settings for a cryptocurrency coin in Settings > Coins > Coin settings > Backend',
    changelog: [
        { version: '1.17.0', notes: 'added' },
        {
            version: '1.19.0',
            notes: 'Renamed from `settings/coin-backend` to `settings/coins/backend`',
        },
    ],

    attributes: {
        symbol: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
            description:
                'The blockchain network symbol for which the backend is being configured (e.g., `btc`, `eth`, `ltc`)',
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
                'Number of regular (non-Tor) backend servers configured for this coin. Only meaningful for custom and electrum backends, otherwise 0.',
        },
        totalOnion: {
            changelog: [{ version: '1.17.0', notes: 'added' }],
            description:
                'Number of Tor (onion) backend servers configured for this coin. Only meaningful for custom and electrum backends, otherwise 0.',
        },
    },
};
