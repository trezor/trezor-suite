import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import { type StakingNavigateFrom } from '../definitions';

type Attributes = {
    action: AttributeDef<'navigate' | 'cancel'>;
    from?: AttributeDef<StakingNavigateFrom>;
    networkSymbol?: AttributeDef<string>;
};

export const stakingNavigateEvent: EventDef<Attributes, EventType.StakingNavigate> = {
    name: EventType.StakingNavigate,
    descriptionTrigger:
        'fired when the user navigates from any staking button to the staking dashboard',
    changelog: [{ version: '26.4.1', notes: 'added' }],
    attributes: {
        action: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
        },
        from: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
        },
        networkSymbol: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
        },
    },
};
