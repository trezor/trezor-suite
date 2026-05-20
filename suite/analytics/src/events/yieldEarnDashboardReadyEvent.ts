import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    hasClaimBanner: AttributeDef<boolean>;
    hasActivePosition: AttributeDef<boolean>;
    availableVaultCount: AttributeDef<number>;
    hasShowMore: AttributeDef<boolean>;
};

export const yieldEarnDashboardReadyEvent: EventDef<Attributes, EventType.YieldEarnDashboardReady> =
    {
        name: EventType.YieldEarnDashboardReady,
        descriptionTrigger:
            'fired once per mount of the earn dashboard after its data has loaded; correlate with `yield/earn-entry` to see origin',
        changelog: [{ version: '26.5.2', notes: 'added' }],

        attributes: {
            hasClaimBanner: {
                description: 'Whether the claim-rewards banner is shown to the user on this entry',
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
                    'Whether the "Show more" button is rendered (i.e. some vault opportunities are hidden below the fold and the user can expand the list)',
                changelog: [{ version: '26.5.2', notes: 'added' }],
            },
        },
    };
