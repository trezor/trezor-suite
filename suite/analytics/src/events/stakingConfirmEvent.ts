import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'stake' | 'unstake' | 'claim' | 'change-delegate' | 'withdraw'>;
    networkSymbol?: AttributeDef<string>;
    success?: AttributeDef<boolean>;
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
        { version: '25.4.0', notes: 'added' },
    ],

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
                'Absent on the immediate send-attempt event. A later broadcast failure emits an additional event with `success=false`; exclude those from send-attempt counts. Absence does not prove broadcast success',
        },
    },
};
