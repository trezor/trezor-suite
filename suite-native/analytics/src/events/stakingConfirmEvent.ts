import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';
import { type StakingConfirmAction } from '../definitions';

type Attributes = {
    action: AttributeDef<StakingConfirmAction>;
    networkSymbol?: AttributeDef<string>;
};

export const stakingConfirmEvent: EventDef<Attributes, EventType.StakingConfirm> = {
    name: EventType.StakingConfirm,
    descriptionTrigger: 'fired when a stake/unstake/claim transaction has been created and sent',
    changelog: [{ version: '26.4.1', notes: 'added' }],
    attributes: {
        action: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
        },
        networkSymbol: {
            changelog: [{ version: '26.4.1', notes: 'added' }],
        },
    },
};
