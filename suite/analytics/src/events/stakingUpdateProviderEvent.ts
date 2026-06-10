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
        >
    >;
    networkSymbol?: AttributeDef<string>;
    currency?: AttributeDef<'crypto' | 'fiat'>;
    votingDelegation?: AttributeDef<'everstake' | 'another_drep'>;
};

export const stakingUpdateProviderEvent: EventDef<Attributes, EventType.StakingUpdateProvider> = {
    name: EventType.StakingUpdateProvider,
    descriptionTrigger:
        'User navigates through the staking provider update flow, with tracking at each step of the process',
    changelog: [{ version: '25.12.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [
                { version: '25.12.0', notes: 'added' },
                {
                    version: '26.3.0',
                    notes: 'action values changed to `continue` | `cancel` | `close`',
                },
            ],
            description:
                'User action: `continue` to proceed, `cancel` to abort, `close` to exit the dialog',
        },
        step: {
            changelog: [{ version: '25.12.0', notes: 'added' }],
            description:
                'Current step in the provider update flow: `staking-dashboard`, `stake-in-a-nutshell-modal`, `funds-maintained-modal`, or `stake-form-modal`',
        },
        networkSymbol: {
            changelog: [{ version: '25.12.0', notes: 'added' }],
            description: 'The blockchain network symbol for staking (e.g., `eth`, `dot`, `ada`)',
        },
        currency: {
            changelog: [{ version: '25.12.0', notes: 'added' }],
            description:
                'Currency type: `crypto` for cryptocurrency amount, `fiat` for fiat currency conversion',
        },
        votingDelegation: {
            changelog: [{ version: '25.12.0', notes: 'added' }],
            description:
                'Voting delegation provider: `everstake` for Everstake provider, `another_drep` for other delegation providers',
        },
    },
};
