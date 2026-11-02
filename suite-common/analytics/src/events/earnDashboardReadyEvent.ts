import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    hasClaimBanner: AttributeDef<boolean>;
    hasYieldPosition: AttributeDef<boolean>;
    hasStakingPosition: AttributeDef<boolean>;
    availableVaultCount: AttributeDef<number>;
    availableStakingCount: AttributeDef<number>;
    hasShowMore: AttributeDef<boolean>;
};

export const earnDashboardReadyEvent: EventDef<Attributes, EventType.EarnDashboardReady> = {
    name: EventType.EarnDashboardReady,
    descriptionTrigger:
        'Fired once per entry into the Earn dashboard after enabled staking and yield sections are ready; correlate with `yield/earn-entry` on both platforms to see origin. Disabled sections contribute zero opportunities and no positions. Mobile also reports re-entry into an already mounted tab, and never reports a hidden dashboard.',
    changelog: [
        { version: '26.5.2', notes: 'added' },
        { version: '26.7.1', notes: 'moved to suite-common, reported from mobile as well' },
        {
            version: '26.11.0',
            notes: 'Renamed from yield/earn-dashboard-ready to cover staking and yield together. hasActivePosition is now hasYieldPosition; added hasStakingPosition and availableStakingCount. Enabled yield waits for successful opportunities and rewards requests; empty dashboards also report.',
        },
    ],

    attributes: {
        hasClaimBanner: {
            description:
                'Whether the claim-rewards banner / claimable-rewards section is shown to the user on this entry',
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
        hasYieldPosition: {
            description: 'Whether the user has at least one active yield position',
            changelog: [{ version: '26.11.0', notes: 'Renamed from hasActivePosition.' }],
        },
        hasStakingPosition: {
            description: 'Whether the user has at least one non-zero staking position',
            changelog: [{ version: '26.11.0', notes: 'added' }],
        },
        availableVaultCount: {
            description:
                'Number of catalog vaults with a recognized network and an underlying token address, using the same filter on both platforms.',
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
        availableStakingCount: {
            description:
                'Number of distinct staking networks offered on the current dashboard, including networks without an existing account. This reflects platform UI: mobile includes testnet tiles when enabled; desktop includes existing or device-activatable networks.',
            changelog: [{ version: '26.11.0', notes: 'added' }],
        },
        hasShowMore: {
            description:
                'Whether either staking or yield renders a "Show more" button; mobile reports false because it renders all opportunities',
            changelog: [
                { version: '26.5.2', notes: 'added' },
                { version: '26.7.1', notes: 'made optional — not reported from mobile' },
                {
                    version: '26.11.0',
                    notes: 'Required on both platforms; mobile reports false.',
                },
            ],
        },
    },
};
