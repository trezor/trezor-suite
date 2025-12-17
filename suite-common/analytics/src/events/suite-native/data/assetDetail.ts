import type { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenAddress, TokenSymbol } from '@suite-common/wallet-types';

import type { AttributeDef, EventDef } from '../../analyticsSchema';
import { EventType } from '../constants';

type Attributes = {
    assetSymbol: AttributeDef<NetworkSymbol>;
    tokenSymbol?: AttributeDef<TokenSymbol>;
    tokenAddress?: AttributeDef<TokenAddress>;
};

export const assetDetail: EventDef<EventType.AssetDetail, Attributes> = {
    name: EventType.AssetDetail,
    descriptionTrigger: '?',
    addedInVersion: '25.4.0',
    changelog: ``,
    lastUpdatedInVersion: '25.12.0',

    attributes: {
        assetSymbol: {
            addedInVersion: '25.4.0',
            changelog: '',
        },
        tokenSymbol: {
            addedInVersion: '25.4.0',
            changelog: '',
        },
        tokenAddress: {
            addedInVersion: '25.4.0',
            changelog: '',
        },
    },
};
