import type { NetworkSymbol } from '@suite-common/wallet-config';

import type { AttributeDef, EventDef } from '../../analyticsSchema';
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
    networkSymbol?: AttributeDef<NetworkSymbol>;
};

export const stakingNavigate: EventDef<EventType.StakingNavigate, Attributes> = {
    name: EventType.StakingNavigate,
    descriptionTrigger:
        'fired when the user navigates from any staking button to the staking dashboard',
    addedInVersion: '25.4.0',
    changelog: `
                  - \`dashboard/staking-dashboard\` changed in 25.12
                `,
    lastUpdatedInVersion: '25.12.0',

    attributes: {
        action: {
            addedInVersion: '25.4.0',
            changelog: '',
        },
        from: {
            addedInVersion: '25.4.0',
            changelog: '',
        },
        networkSymbol: {
            addedInVersion: '25.4.0',
            changelog: '',
        },
    },
};
