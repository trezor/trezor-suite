import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { EarnAnalyticsStep, EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    step: AttributeDef<Extract<EarnAnalyticsStep, 'staking-dashboard'>>;
    networkSymbol?: AttributeDef<string>;
    currency?: AttributeDef<'crypto' | 'fiat'>;
};

export const stakingChangeDelegateEvent: EventDef<Attributes, EventType.StakingChangeDelegate> = {
    name: EventType.StakingChangeDelegate,
    descriptionTrigger:
        'User navigates through the change delegate/validator flow, with tracking at each step of the process',
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
                'The action taken by the user: `continue` to proceed with changing delegate, `cancel` to abort the process, `close` to dismiss the modal',
        },
        step: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
            description:
                'The current step in the change delegate flow: `staking-dashboard` when initiated from the staking dashboard',
        },
        networkSymbol: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
            description:
                'The blockchain network symbol where the delegate change is occurring (e.g., `ada`)',
        },
        currency: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
            description:
                'The currency type used for amount display: `crypto` for cryptocurrency amounts, `fiat` for fiat currency amounts',
        },
    },
};
