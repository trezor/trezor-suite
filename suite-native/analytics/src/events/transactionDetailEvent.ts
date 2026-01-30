import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';

import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
    tokenSymbol?: AttributeDef<TokenSymbol>;
    tokenAddress?: AttributeDef<TokenAddress>;
};

export const transactionDetailEvent: EventDef<Attributes, EventType.TransactionDetail> = {
    name: EventType.TransactionDetail,
    descriptionTrigger: 'On transaction detail opening',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        assetSymbol: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Describes the network of the account (`btc`, `eth`,…)',
        },
        tokenSymbol: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Symbol of the token (`usdt`, `link`...)',
        },
        tokenAddress: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description:
                'Token contract address, e.g: `0xdac17f958d2ee523a2206206994597c13d831ec7`',
        },
    },
};
