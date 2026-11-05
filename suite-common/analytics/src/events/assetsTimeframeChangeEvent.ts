import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

export type AssetsTimeframe = '1d' | '1w' | '1m' | '6m' | '1y' | 'all';

type Attributes = {
    timeframe: AttributeDef<AssetsTimeframe>;
    networkSymbol: AttributeDef<string>;
    contractAddress?: AttributeDef<string>;
};

export const assetsTimeframeChangeEvent: EventDef<Attributes, EventType.AssetsTimeframeChange> = {
    name: EventType.AssetsTimeframeChange,
    descriptionTrigger: 'User picks another price chart timeframe on the asset detail',
    changelog: [{ version: '26.11.0', notes: 'added' }],

    attributes: {
        timeframe: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description: 'The picked chart timeframe',
        },
        networkSymbol: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description: 'The network symbol of the asset (e.g., `btc`, `eth`)',
        },
        contractAddress: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description: 'The token contract address, empty for a network coin',
        },
    },
};
