import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'continue' | 'cancel'>;
    step: AttributeDef<'staking-dashboard' | 'claim-form-modal'>;
    networkSymbol?: AttributeDef<string>;
};

export const stakingClaimEvent: EventDef<Attributes, EventType.StakingClaim> = {
    name: EventType.StakingClaim,
    descriptionTrigger: 'fired on every step during the claiming flow',
    changelog: [{ version: '25.4.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
        step: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
        networkSymbol: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
    },
};
