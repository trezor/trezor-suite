import type { AttributeDef, EventDef } from '@suite-common/analytics';
import type { EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';
import { type StakingClaimStep } from '../definitions';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    step: AttributeDef<StakingClaimStep>;
    networkSymbol?: AttributeDef<string>;
};

export const stakingClaimEvent: EventDef<Attributes, EventType.StakingClaim> = {
    name: EventType.StakingClaim,
    descriptionTrigger:
        'User navigates through the staking claim/reward collection flow, with tracking at each step of the process',
    changelog: [{ version: '26.4.1', notes: 'added' }],
    attributes: {
        action: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
            description:
                'User action: `continue` to proceed, `cancel` to abort, `close` to exit the dialog',
        },
        step: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
            description:
                'Current step in the claim flow: `staking-dashboard` from the dashboard, `claim-form-modal` in the claim form dialog',
        },
        networkSymbol: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
            description:
                'The blockchain network symbol for which rewards are being claimed (e.g., `eth`, `sol`)',
        },
    },
};
