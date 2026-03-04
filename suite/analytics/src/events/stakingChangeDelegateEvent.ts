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
    descriptionTrigger: 'fired on every step during the change delegate flow',
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
        },
        step: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
        networkSymbol: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
        currency: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
    },
};
