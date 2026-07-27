import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';
import { type StakingStakeStep } from '../definitions';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    step: AttributeDef<StakingStakeStep>;
    networkSymbol?: AttributeDef<string>;
    currency?: AttributeDef<'crypto' | 'fiat'>;
};

export const stakingStakeEvent: EventDef<Attributes, EventType.StakingStake> = {
    name: EventType.StakingStake,
    descriptionTrigger:
        'User navigates through the staking flow to stake cryptocurrency, with tracking at each step including educational modals and form submission',
    changelog: [{ version: '26.4.1', notes: 'added' }],
    attributes: {
        action: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
            description:
                'User action: `continue` to proceed through the flow, `cancel` to exit, `close` to dismiss',
        },
        step: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
            description:
                'Current step in the staking flow: `staking-dashboard`, `stake-in-a-nutshell-modal`, `funds-maintained-modal`, `stake-form-modal`, or `entry-period-stake-modal`',
        },
        networkSymbol: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
            description:
                'The blockchain network symbol for which staking is being performed (e.g., `eth`, `sol`, `ada`)',
        },
        currency: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
            description:
                'The display currency format: `crypto` for cryptocurrency amounts, `fiat` for fiat currency conversion',
        },
    },
};
