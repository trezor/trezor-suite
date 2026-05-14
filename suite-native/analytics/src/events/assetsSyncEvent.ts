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
    descriptionTrigger: 'On Sync my coin confirmation.',
    changelog: [
        { version: '23.4.1', notes: 'added' },
        { version: '24.3.1', notes: '"tokenAddresses" attribute added' },
    ],

    attributes: {
        assetSymbol: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'The symbol of the synced asset',
        },
        tokenSymbols: {
            changelog: [
                { version: '23.4.1', notes: 'added' },
                { version: '24.3.1', notes: 'renamed from `tokenSymbol` to `tokenSymbols`' },
            ],
            description: 'The symbols of the synced tokens',
        },
        tokenAddresses: {
            changelog: [{ version: '24.3.1', notes: 'added' }],
            description: 'The addresses of the synced tokens',
        },
    },
};
