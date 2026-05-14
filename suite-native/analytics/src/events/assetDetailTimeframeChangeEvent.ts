import { type AttributeDef, type EventDef } from '@suite-common/analytics';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';

import { EventType } from '../constants';

type Attributes = {
    timeframe: AttributeDef<string>;
    assetSymbol: AttributeDef<NetworkSymbol>;
    tokenSymbol?: AttributeDef<TokenSymbol>;
    tokenAddress?: AttributeDef<TokenAddress>;
};

export const assetDetailTimeframeChangeEvent: EventDef<
    Attributes,
    EventType.AssetDetailTimeframeChange
> = {
    name: EventType.AssetDetailTimeframeChange,
    descriptionTrigger: 'On every timeframe (scope) change of asset chart.',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        timeframe: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'The selected timeframe for the asset detail graph',
        },
        assetSymbol: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'The symbol of the asset',
        },
        tokenSymbol: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'The symbols of the account tokens',
        },
        tokenAddress: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'The contract address of the account tokens',
        },
    },
};
