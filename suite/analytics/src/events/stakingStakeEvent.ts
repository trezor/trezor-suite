import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { EarnAnalyticsStep, EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    step: AttributeDef<
        Extract<
            EarnAnalyticsStep,
            | 'staking-dashboard'
            | 'stake-in-a-nutshell-modal'
            | 'funds-maintained-modal'
            | 'stake-form-modal'
            | 'entry-period-stake-modal'
        >
    >;
    networkSymbol?: AttributeDef<string>;
    currency?: AttributeDef<'crypto' | 'fiat'>;
    resource?: AttributeDef<'bandwidth' | 'energy'>;
};

export const stakingStakeEvent: EventDef<Attributes, EventType.StakingStake> = {
    name: EventType.StakingStake,
    descriptionTrigger:
        'User navigates through the staking flow, with tracking at each step of the process',
    changelog: [{ version: '25.4.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [
                { version: '25.4.0', notes: 'added' },
                {
                    version: '26.3.0',
                    notes: 'action values changed to `continue` | `cancel` | `close`',
                },
            ],
            description:
                'User action in the staking flow: `continue` to proceed, `cancel` to abort, `close` to exit the modal',
        },
        step: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
            description:
                'Current step in the staking flow: `staking-dashboard`, `stake-in-a-nutshell-modal`, `funds-maintained-modal`, `stake-form-modal`, or `entry-period-stake-modal`',
        },
        networkSymbol: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
            description: 'The blockchain network symbol for staking (e.g., `eth`, `ada`, `sol`)',
        },
        currency: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
            description:
                'The display currency format: `crypto` for cryptocurrency amounts, `fiat` for fiat currency conversion',
        },
        resource: {
            changelog: [{ version: '26.7.0', notes: 'added' }],
            description:
                'The Tron resource the frozen balance provides: `bandwidth` or `energy`; only sent for Tron',
        },
    },
};
