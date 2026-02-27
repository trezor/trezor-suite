import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { EarnAnalyticsStep } from '@suite-common/suite-types';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'continue' | 'cancel'>;
    step: AttributeDef<EarnAnalyticsStep>;
    networkSymbol?: AttributeDef<string>;
    currency?: AttributeDef<'crypto' | 'fiat'>;
};

export const stakingYieldEvent: EventDef<Attributes, EventType.StakingYield> = {
    name: EventType.StakingYield,
    descriptionTrigger: 'fired on every step during the staking flow',
    changelog: [{ version: '26.2.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
        },
        step: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
        },
        networkSymbol: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
        },
        currency: {
            changelog: [{ version: '26.2.0', notes: 'added' }],
        },
    },
};
