import type { AttributeDef, EventDef } from '@suite-common/analytics-types';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'navigate' | 'cancel'>;
    from: AttributeDef<
        | 'sidebar'
        | 'account/navigation'
        | 'account/banner'
        | 'account/tradebox'
        | 'dashboard/assets'
        | 'dashboard/staking-dashboard/staking-outdated-provider'
        | 'dashboard/staking-dashboard/staking-max'
        | 'dashboard/staking-dashboard/staked-but-insufficient-funds'
        | 'dashboard/staking-dashboard/staking-active'
        | 'dashboard/staking-dashboard/insufficient-funds'
        | 'dashboard/staking-dashboard/staking-inactive'
    >;
    networkSymbol?: AttributeDef<string>;
};

export const stakingNavigateEvent: EventDef<Attributes, EventType.StakingNavigate> = {
    name: EventType.StakingNavigate,
    descriptionTrigger:
        'fired when the user navigates from any staking button to the staking dashboard',
    changelog: [
        { version: '25.4.0', notes: 'added' },
        {
            version: '25.12.0',
            notes: `\`dashboard/staking-dashboard\` changed
                | 'dashboard/staking-dashboard/staking-outdated-provider'
                | 'dashboard/staking-dashboard/staking-max'
                | 'dashboard/staking-dashboard/staked-but-insufficient-funds'
                | 'dashboard/staking-dashboard/staking-active'
                | 'dashboard/staking-dashboard/insufficient-funds'
                | 'dashboard/staking-dashboard/staking-inactive'`,
        },
    ],

    attributes: {
        action: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
        from: {
            changelog: [
                { version: '25.4.0', notes: 'added' },
                { version: '25.12.0', notes: 'dashboard/staking-dashboard changed in 25.12' },
            ],
        },
        networkSymbol: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
        },
    },
};
