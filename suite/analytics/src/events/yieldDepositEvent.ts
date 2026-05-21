import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    type: AttributeDef<
        | 'approve'
        | 'approve-modal'
        | 'approve-success'
        | 'revoke'
        | 'revoke-modal'
        | 'revoke-success'
        | 'modify-allowance'
        | 'deposit'
        | 'simulation-modal'
        | 'success'
        | 'error'
        | 'leftPending'
        | 'firmware-upgrade-needed-modal'
    >;
    networkSymbol?: AttributeDef<string>;
    vaultId?: AttributeDef<string>;
    approvalType?: AttributeDef<'INFINITE' | 'MINIMAL'>;
    durationMs?: AttributeDef<number>;
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
            changelog: [
                { version: '26.5.0', notes: 'added' },
                {
                    version: '26.5.2',
                    notes: 'added `approve-success`, `revoke-success`, `leftPending`, `simulation-modal`, `firmware-upgrade-needed-modal` values',
                },
            ],
        },
        networkSymbol: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        vaultId: {
            description: 'Internal vault identifier (vault.id), unique per Morpho vault',
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
        approvalType: {
            description:
                "Type of approve selected by the user in the device-confirmation modal: 'MINIMAL' = exact amount, 'INFINITE' = unlimited allowance",
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
        durationMs: {
            description:
                'Milliseconds between submission (pending tx appearing in state) and resolution (success / error / leftPending)',
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
        errorMessage: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
    },
};
