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
    descriptionTrigger:
        'User changes the timeframe for the asset detail chart (e.g., 1d, 1w, 1m, 6m, 1y, All)',
    changelog: [{ version: '23.4.1', notes: 'added' }],

    attributes: {
        timeframe: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description:
                'The selected timeframe for the asset detail graph (e.g., `1d` for 1 day, `1w` for 1 week, `1m` for 1 month, `6m` for 6 months, `1y` for 1 year, `all` for all time)',
        },
        assetSymbol: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description: 'The network symbol of the asset being viewed (e.g., `btc`, `eth`, `ada`)',
        },
        tokenSymbol: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description:
                'The symbol of the specific token being viewed (optional, only for token assets like ERC-20 tokens)',
        },
        tokenAddress: {
            changelog: [{ version: '23.4.1', notes: 'added' }],
            description:
                'The contract address of the specific token being viewed (optional, only for token assets)',
        },
    },
};
