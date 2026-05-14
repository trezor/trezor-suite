import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    type: AttributeDef<
        | 'approve'
        | 'approve-modal'
        | 'revoke'
        | 'revoke-modal'
        | 'modify'
        | 'supply'
        | 'success'
        | 'error'
    >;
    networkSymbol?: AttributeDef<string>;
    contractAddress?: AttributeDef<string>;
    errorMessage?: AttributeDef<string>;
};

export const yieldSupplyEvent: EventDef<Attributes, EventType.YieldSupply> = {
    name: EventType.YieldSupply,
    descriptionTrigger: 'fired on stablecoin yield supply actions',
    changelog: [{ version: '26.5.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        type: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        networkSymbol: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        contractAddress: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        errorMessage: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
    },
};
