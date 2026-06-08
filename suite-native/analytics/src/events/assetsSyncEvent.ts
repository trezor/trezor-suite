import { type AttributeDef, type EventDef } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';

import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
    tokenSymbols?: AttributeDef<TokenSymbol[]>;
    tokenAddresses?: AttributeDef<TokenAddress[]>;
};

export const assetsSyncEvent: EventDef<Attributes, EventType.AssetsSync> = {
    name: EventType.AssetsSync,
    descriptionTrigger:
        'User confirms synchronization of a cryptocurrency asset or token in the app to update holdings',
    changelog: [
        { version: '23.4.1', notes: 'added' },
        { version: '24.3.1', notes: '`tokenAddresses` attribute added' },
    ],

    attributes: {
        assetSymbol: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description:
                'The network symbol of the asset being synchronized (e.g., `btc`, `eth`, `xrp`)',
        },
        tokenSymbols: {
            changelog: [
                { version: '23.4.1', notes: 'added' },
                { version: '24.3.1', notes: 'renamed from `tokenSymbol` to `tokenSymbols`' },
            ],
            description:
                'Array of token symbols for non-empty tokens being synchronized (optional, only for networks supporting tokens)',
        },
        tokenAddresses: {
            changelog: [{ version: '24.3.1', notes: 'added' }],
            description:
                'Array of token contract addresses for tokens being synchronized (optional, used to identify specific token instances)',
        },
    },
};
