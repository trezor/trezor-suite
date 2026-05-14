import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';

import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
    tokenSymbol?: AttributeDef<TokenSymbol>;
    tokenAddress?: AttributeDef<TokenAddress>;
};

export const transactionDetailEvent: EventDef<Attributes, EventType.TransactionDetail> = {
    name: EventType.TransactionDetail,
    descriptionTrigger: 'On transaction detail opening.',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        assetSymbol: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Describes the network of the account',
        },
        tokenSymbol: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Symbol of the token',
        },
        tokenAddress: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'Token contract address',
        },
    },
};
