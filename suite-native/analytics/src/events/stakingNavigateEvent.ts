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
        'User navigates from any staking button or dashboard state to the staking interface or cancels the navigation',
    changelog: [{ version: '26.4.1', notes: 'added' }],
    attributes: {
        action: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
            description:
                'User action: `navigate` when proceeding to staking, `cancel` when dismissing the flow',
        },
        from: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
            description:
                'The staking dashboard state from which navigation occurred (e.g., `dashboard/staking-dashboard/staking-inactive`, `dashboard/staking-dashboard/staking-active`, `dashboard/staking-dashboard/staking-max`, `dashboard/staking-dashboard/insufficient-funds`, `dashboard/staking-dashboard/staked-but-insufficient-funds`)',
        },
        networkSymbol: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
            description: 'The blockchain network symbol for staking (e.g., `eth`, `ada`, `sol`)',
        },
    },
};
