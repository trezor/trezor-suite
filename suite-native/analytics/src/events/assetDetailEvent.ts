import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';

import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
    tokenSymbol?: AttributeDef<TokenSymbol>;
    tokenAddress?: AttributeDef<TokenAddress>;
};

export const assetDetailEvent: EventDef<Attributes, EventType.AssetDetail> = {
    name: EventType.AssetDetail,
    descriptionTrigger: 'User opens the detail view for an asset (cryptocurrency or token)',
    description: 'For ERC20 tokens additionally contains `tokenSymbol` and `tokenAddress`',
    changelog: [
        { version: '23.4.1', notes: 'added' },
        { version: '24.3.1', notes: 'optional property tokenAddress added' },
    ],

    attributes: {
        assetSymbol: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'The network symbol of the asset (e.g., `btc`, `eth`, `sol` etc.)',
        },
        tokenSymbol: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description:
                'The symbol of the token (only for ERC20/token assets, not for native network assets)',
        },
        tokenAddress: {
            changelog: [{ version: '24.3.1', notes: 'added' }],
            description: 'The contract address of the token (only for non-native tokens)',
        },
    },
};
