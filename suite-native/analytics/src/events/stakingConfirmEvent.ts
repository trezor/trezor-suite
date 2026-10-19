import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import { type StakingConfirmAction } from '../definitions';

type Attributes = {
    action: AttributeDef<StakingConfirmAction>;
    networkSymbol?: AttributeDef<string>;
};

export const stakingConfirmEvent: EventDef<Attributes, EventType.StakingConfirm> = {
    name: EventType.StakingConfirm,
    descriptionTrigger:
        'The user confirms sending a signed staking transaction, before waiting for the broadcast result. This records a send attempt, not successful broadcast or on-chain confirmation',
    changelog: [
        {
            version: '26.11.0',
            notes: 'Send attempts are reported immediately on all staking networks; no broadcast wait. Clarified attempt versus failure semantics.',
        },
        { version: '26.4.1', notes: 'added' },
    ],
    attributes: {
        action: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
            description:
                'The staking action being confirmed: `stake` for depositing funds, `unstake` for withdrawing funds, `claim` for collecting rewards',
        },
        networkSymbol: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
            description:
                'The blockchain network symbol for the staking operation (e.g., `eth`, `sol`, `ada`)',
        },
    },
};
