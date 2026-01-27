import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'continue' | 'cancel'>;
    step: AttributeDef<
        | 'staking-dashboard'
        | 'stake-in-a-nutshell-modal'
        | 'funds-maintained-modal'
        | 'stake-form-modal'
        | 'entry-period-stake-modal'
    >;
    networkSymbol?: AttributeDef<string>;
    currency?: AttributeDef<'crypto' | 'fiat'>;
};

export const stakingStakeEvent: EventDef<Attributes, EventType.StakingStake> = {
    name: EventType.StakingStake,
    descriptionTrigger: 'fired on every step during the staking flow',
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
