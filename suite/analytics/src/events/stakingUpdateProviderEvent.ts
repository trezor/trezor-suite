import type { AttributeDef, EventDef } from '@suite-common/analytics-types';

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
    votingDelegation?: AttributeDef<'everstake' | 'another_drep'>;
};

export const stakingUpdateProviderEvent: EventDef<Attributes, EventType.StakingUpdateProvider> = {
    name: EventType.StakingUpdateProvider,
    descriptionTrigger: 'fired on every step during the update provider flow',
    changelog: [{ version: '25.12.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '25.12.0', notes: 'added' }],
        },
        step: {
            changelog: [{ version: '25.12.0', notes: 'added' }],
        },
        networkSymbol: {
            changelog: [{ version: '25.12.0', notes: 'added' }],
        },
        currency: {
            changelog: [{ version: '25.12.0', notes: 'added' }],
        },
        votingDelegation: {
            changelog: [{ version: '25.12.0', notes: 'added' }],
        },
    },
};
