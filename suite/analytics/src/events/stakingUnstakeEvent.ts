import type { AttributeDef, EventDef } from '@suite-common/analytics-types';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'continue' | 'cancel'>;
    step: AttributeDef<'staking-dashboard' | 'unstake-form-modal'>;
    networkSymbol?: AttributeDef<string>;
    currency?: AttributeDef<'crypto' | 'fiat'>;
};

export const stakingUnstakeEvent: EventDef<Attributes, EventType.StakingUnstake> = {
    name: EventType.StakingUnstake,
    descriptionTrigger: 'fired on every step during the unstaking flow',
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
        currency: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
    },
};
