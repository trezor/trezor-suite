import type { AttributeDef, EventDef } from '@suite-common/analytics-types';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';

import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
    tokenSymbol?: AttributeDef<TokenSymbol>;
    tokenAddress?: AttributeDef<TokenAddress>;
};

export const assetDetailEvent: EventDef<Attributes, EventType.AssetDetail> = {
    name: EventType.AssetDetail,
    descriptionTrigger: '?',
    changelog: [
        { version: '25.4.0', notes: 'added' },
        { version: '25.12.0', notes: 'updated' },
    ],

    attributes: {
        assetSymbol: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
        tokenSymbol: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
        tokenAddress: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
    },
};
