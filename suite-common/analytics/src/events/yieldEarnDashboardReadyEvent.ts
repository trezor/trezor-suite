import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    hasClaimBanner: AttributeDef<boolean>;
    hasActivePosition: AttributeDef<boolean>;
    availableVaultCount: AttributeDef<number>;
    hasShowMore?: AttributeDef<boolean>;
};

export const yieldEarnDashboardReadyEvent: EventDef<Attributes, EventType.YieldEarnDashboardReady> =
    {
        name: EventType.YieldEarnDashboardReady,
        descriptionTrigger:
            'fired once per mount of the earn dashboard after its data has loaded; correlate with `yield/earn-entry` (desktop) or `earn/navigate` (mobile) to see origin',
        changelog: [
            { version: '26.5.2', notes: 'added' },
            { version: '26.7.1', notes: 'moved to suite-common, reported from mobile as well' },
        ],

        attributes: {
            hasClaimBanner: {
                description:
                    'Whether the claim-rewards banner / claimable-rewards section is shown to the user on this entry',
                changelog: [{ version: '26.5.2', notes: 'added' }],
            },
            hasActivePosition: {
                description: 'Whether the user has at least one active yield position',
                changelog: [{ version: '26.5.2', notes: 'added' }],
            },
            availableVaultCount: {
                description: 'Number of vault opportunities available to the user at entry time',
                changelog: [{ version: '26.5.2', notes: 'added' }],
            },
            hasShowMore: {
                description:
                    'Whether the "Show more" button is rendered (i.e. some vault opportunities are hidden below the fold and the user can expand the list); desktop only',
                changelog: [
                    { version: '26.5.2', notes: 'added' },
                    { version: '26.7.1', notes: 'made optional — not reported from mobile' },
                ],
            },
        },
    };
