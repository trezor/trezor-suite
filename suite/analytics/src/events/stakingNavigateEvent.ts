import type { AttributeDef, EventDef } from '@suite-common/analytics';

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
        | 'dashboard/staking-dashboard/staking-remaining-votes'
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
        {
            version: '26.7.0',
            notes: 'added dashboard/staking-dashboard/staking-remaining-votes value',
        },
    ],

    attributes: {
        action: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
            description:
                'User action: `navigate` when proceeding to staking, `cancel` when dismissing the navigation',
        },
        from: {
            changelog: [
                { version: '25.4.0', notes: 'added' },
                { version: '25.12.0', notes: 'dashboard/staking-dashboard changed in 25.12' },
                {
                    version: '26.7.0',
                    notes: 'added dashboard/staking-dashboard/staking-remaining-votes value',
                },
            ],
            description:
                'The location or UI element from which staking navigation was initiated (e.g., `sidebar`, `dashboard/assets`, `account/banner`)',
        },
        networkSymbol: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
            description: 'The blockchain network symbol for staking (e.g., `eth`, `ada`, `sol`)',
        },
    },
};
