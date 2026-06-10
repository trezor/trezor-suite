import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import { type StakingConfirmAction } from '../definitions';

type Attributes = {
    action: AttributeDef<StakingConfirmAction>;
    networkSymbol?: AttributeDef<string>;
};

export const stakingConfirmEvent: EventDef<Attributes, EventType.StakingConfirm> = {
    name: EventType.StakingConfirm,
    descriptionTrigger: 'A stake/unstake/claim transaction is created and sent to the blockchain',
    changelog: [{ version: '26.4.1', notes: 'added' }],
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
