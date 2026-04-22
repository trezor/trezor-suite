import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { EarnAnalyticsStep, EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';

export type StakingClaimStep = Extract<EarnAnalyticsStep, 'staking-dashboard' | 'claim-form-modal'>;

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    step: AttributeDef<StakingClaimStep>;
    networkSymbol?: AttributeDef<string>;
};

export const stakingClaimEvent: EventDef<Attributes, EventType.StakingClaim> = {
    name: EventType.StakingClaim,
    descriptionTrigger: 'fired on every step during the claiming flow',
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
    },
};
