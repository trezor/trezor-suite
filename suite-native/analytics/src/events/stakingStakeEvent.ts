import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { EarnAnalyticsStep, EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';

export type StakingStakeStep = Extract<
    EarnAnalyticsStep,
    | 'staking-dashboard'
    | 'stake-in-a-nutshell-modal'
    | 'funds-maintained-modal'
    | 'stake-form-modal'
    | 'entry-period-stake-modal'
>;

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    step: AttributeDef<StakingStakeStep>;
    networkSymbol?: AttributeDef<string>;
    currency?: AttributeDef<'crypto' | 'fiat'>;
};

export const stakingStakeEvent: EventDef<Attributes, EventType.StakingStake> = {
    name: EventType.StakingStake,
    descriptionTrigger: 'fired on every step during the staking flow',
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
