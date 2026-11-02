import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

export type StakingNavigateFrom =
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
    | 'choose-account-sheet'
    | 'enable-network-sheet'
    | 'unknown';

type Attributes = {
    action: AttributeDef<'navigate' | 'cancel'>;
    from: AttributeDef<StakingNavigateFrom>;
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
        {
            version: '26.11.0',
            notes: 'Shared by desktop and mobile with the same dashboard state origins; mobile sheet cancellations identify their origin.',
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
                {
                    version: '26.11.0',
                    notes: 'Aligned mobile dashboard origins; added choose-account-sheet, enable-network-sheet and unknown.',
                },
            ],
            description:
                'Navigation origin. Shared dashboard states use dashboard/staking-dashboard/* on both platforms. Native account selection and network enabling cancellations use choose-account-sheet and enable-network-sheet; unknown means the state could not be classified. Desktop also has sidebar and account origins.',
        },
        networkSymbol: {
            changelog: [{ version: '25.4.0', notes: 'added' }],
            description: 'The blockchain network symbol for staking (e.g., `eth`, `ada`, `sol`)',
        },
    },
};
