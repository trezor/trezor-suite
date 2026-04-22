import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'stake' | 'unstake' | 'claim'>;
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
