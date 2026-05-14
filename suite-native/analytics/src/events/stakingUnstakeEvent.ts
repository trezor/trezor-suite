import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';
import { type StakingUnstakeStep } from '../definitions';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    step: AttributeDef<StakingUnstakeStep>;
    networkSymbol?: AttributeDef<string>;
    currency?: AttributeDef<'crypto' | 'fiat'>;
};

export const stakingUnstakeEvent: EventDef<Attributes, EventType.StakingUnstake> = {
    name: EventType.StakingUnstake,
    descriptionTrigger: 'fired on every step during the unstaking flow',
    changelog: [{ version: '26.4.1', notes: 'added' }],
    attributes: {
        action: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
        },
        step: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
        },
        networkSymbol: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
        },
        currency: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
        },
    },
};
