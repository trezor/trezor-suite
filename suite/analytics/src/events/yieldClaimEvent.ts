import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    type: AttributeDef<'claim' | 'success' | 'error'>;
    networkSymbol?: AttributeDef<string>;
    errorMessage?: AttributeDef<string>;
};

export const yieldClaimEvent: EventDef<Attributes, EventType.YieldClaim> = {
    name: EventType.YieldClaim,
    descriptionTrigger: 'fired on stablecoin yield claim actions',
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
        errorMessage: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
    },
};
