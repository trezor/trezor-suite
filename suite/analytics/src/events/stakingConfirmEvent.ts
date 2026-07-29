import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'stake' | 'unstake' | 'claim' | 'change-delegate' | 'withdraw'>;
    networkSymbol?: AttributeDef<string>;
    success?: AttributeDef<boolean>;
};

export const stakingConfirmEvent: EventDef<Attributes, EventType.StakingConfirm> = {
    name: EventType.StakingConfirm,
    descriptionTrigger: 'A stake/unstake/claim transaction is created and sent to the blockchain',
    changelog: [{ version: '25.4.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [
                { version: '25.4.0', notes: 'added' },
                {
                    version: '26.7.0',
                    notes: 'added `withdraw` value for withdrawing an expired Tron unstake; for Tron, `stake` is the freeze transaction and `change-delegate` the vote transaction',
                },
            ],
        },
        networkSymbol: {
            changelog: [{ version: '25.12.0', notes: 'added' }],
        },
        success: {
            changelog: [{ version: '26.8.0', notes: 'added' }],
            description:
                'Set to `false` when the signed staking transaction fails to broadcast to the blockchain; absent otherwise',
        },
    },
};
