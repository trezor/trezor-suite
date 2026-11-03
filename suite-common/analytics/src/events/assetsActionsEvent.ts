import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    action: AttributeDef<'more-menu'>;
    networkSymbol: AttributeDef<string>;
    contractAddress?: AttributeDef<string>;
};

export const assetsActionsEvent: EventDef<Attributes, EventType.AssetsActions> = {
    name: EventType.AssetsActions,
    descriptionTrigger: 'User interacts with an action on the asset detail',
    changelog: [{ version: '26.11.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description: '`more-menu` when the user opens the asset detail "…" menu',
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
