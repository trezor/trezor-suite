import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { EarnAnalyticsStep, EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    step: AttributeDef<
        Extract<
            EarnAnalyticsStep,
            'staking-dashboard' | 'unstake-form-modal' | 'withdraw-form-modal'
        >
    >;
    networkSymbol?: AttributeDef<string>;
    currency?: AttributeDef<'crypto' | 'fiat'>;
    resource?: AttributeDef<'bandwidth' | 'energy'>;
};

export const stakingUnstakeEvent: EventDef<Attributes, EventType.StakingUnstake> = {
    name: EventType.StakingUnstake,
    descriptionTrigger:
        'User navigates through the unstaking flow, with tracking at each step of the process',
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
                'The action taken by the user: `continue` to proceed with unstaking, `cancel` to abort the process, `close` to dismiss the modal',
        },
        step: {
            changelog: [
                { version: '25.4.0', notes: 'added' },
                {
                    version: '26.7.0',
                    notes: 'added `withdraw-form-modal` value for the Tron withdraw-expired-unstake form',
                },
            ],
            description:
                'The current step in the unstaking flow: `staking-dashboard` when initiated from dashboard, `unstake-form-modal` when in the unstaking form, `withdraw-form-modal` when in the Tron withdraw form',
        },
        networkSymbol: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
            description: 'The blockchain network symbol where unstaking is occurring (e.g., `eth`)',
        },
        currency: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
            description:
                'The currency type used for amount display: `crypto` for cryptocurrency amounts, `fiat` for fiat currency amounts',
        },
        resource: {
            changelog: [{ version: '26.7.0', notes: 'added' }],
            description:
                'The Tron resource the unfrozen balance was providing: `bandwidth` or `energy`; only sent for Tron',
        },
    },
};
