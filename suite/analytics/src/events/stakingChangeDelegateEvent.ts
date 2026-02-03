import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'continue' | 'cancel'>;
    step: AttributeDef<'staking-dashboard'>;
    networkSymbol?: AttributeDef<string>;
    currency?: AttributeDef<'crypto' | 'fiat'>;
};

export const stakingChangeDelegateEvent: EventDef<Attributes, EventType.StakingChangeDelegate> = {
    name: EventType.StakingChangeDelegate,
    descriptionTrigger: 'fired on every step during the change delegate flow',
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
