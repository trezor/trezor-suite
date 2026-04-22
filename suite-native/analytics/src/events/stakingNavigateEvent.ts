import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

export type StakingNavigateFrom =
    | 'dashboard/staking-dashboard/staking-inactive'
    | 'dashboard/staking-dashboard/staking-active'
    | 'dashboard/staking-dashboard/staking-max'
    | 'dashboard/staking-dashboard/insufficient-funds'
    | 'dashboard/staking-dashboard/staked-but-insufficient-funds';

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
