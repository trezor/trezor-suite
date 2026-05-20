import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    type: AttributeDef<
        | 'approve'
        | 'approve-modal'
        | 'revoke'
        | 'revoke-modal'
        | 'modify-allowance'
        | 'deposit'
        | 'success'
        | 'error'
    >;
    networkSymbol?: AttributeDef<string>;
    vaultId?: AttributeDef<string>;
    errorMessage?: AttributeDef<string>;
};

export const yieldDepositEvent: EventDef<Attributes, EventType.YieldDeposit> = {
    name: EventType.YieldDeposit,
    descriptionTrigger: 'fired on stablecoin yield deposit actions',
    changelog: [
        { version: '26.5.0', notes: 'added (as yield/supply)' },
        { version: '26.5.2', notes: 'renamed from yield/supply to yield/deposit' },
    ],

    attributes: {
        action: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        type: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        networkSymbol: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        vaultId: {
            description: 'Internal vault identifier (vault.id), unique per Morpho vault',
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
        errorMessage: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
    },
};
