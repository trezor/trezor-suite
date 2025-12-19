import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
    tokenSymbol?: AttributeDef<TokenSymbol>;
    tokenAddress?: AttributeDef<TokenAddress>;
};

export const assetDetail: EventDef<Attributes, 'asset_detail'> = {
    name: 'asset_detail',
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
