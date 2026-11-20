import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    action: AttributeDef<'expand' | 'collapse'>;
    collectionCount?: AttributeDef<number>;
    hiddenCount?: AttributeDef<number>;
};

export const dashboardNftsEvent: EventDef<Attributes, EventType.DashboardNfts> = {
    name: EventType.DashboardNfts,
    descriptionTrigger: 'User expands or collapses the NFTs section under the Home asset table',
    changelog: [{ version: '26.11.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description: '`expand` when the section opens, `collapse` when it closes',
        },
        collectionCount: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description: 'Number of shown NFT collections, reported on `expand`',
        },
        hiddenCount: {
            changelog: [{ version: '26.11.0', notes: 'added' }],
            description: 'Number of hidden NFT collections, reported on `expand`',
        },
    },
};
