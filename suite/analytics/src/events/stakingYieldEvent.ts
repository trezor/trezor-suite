import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { EarnAnalyticsStep, EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    step: AttributeDef<
        Extract<
            EarnAnalyticsStep,
            | 'earn-dashboard'
            | 'yield-supply'
            | 'yield-withdraw'
            | 'stake-in-a-nutshell-modal'
            | 'funds-maintained-modal'
        >
    >;
    networkSymbol?: AttributeDef<string>;
    currency?: AttributeDef<'crypto' | 'fiat'>;
};

export const stakingYieldEvent: EventDef<Attributes, EventType.StakingYield> = {
    name: EventType.StakingYield,
    descriptionTrigger: 'fired on every step during the yield flow',
    changelog: [{ version: '26.2.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [
                { version: '26.2.0', notes: 'added' },
                {
                    version: '26.3.0',
                    notes: 'action values changed to `continue` | `cancel` | `close`',
                },
            ],
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
