import type { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';

import type { AttributeDef, EventDef } from '../../analyticsSchema';
import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
    tokenSymbol?: AttributeDef<TokenSymbol>;
    tokenAddress?: AttributeDef<TokenAddress>;
};

export const assetDetail = {
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
} satisfies EventDef<Attributes>;
