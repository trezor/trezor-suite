import type { AttributeDef, EventDef } from '@suite-common/analytics';
import { type EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    type: AttributeDef<
        | 'withdraw'
        | 'simulation-modal'
        | 'success'
        | 'error'
        | 'leftPending'
        | 'firmware-upgrade-needed-modal'
    >;
    networkSymbol?: AttributeDef<string>;
    vaultId?: AttributeDef<string>;
    durationMs?: AttributeDef<number>;
    errorMessage?: AttributeDef<string>;
};

export const yieldWithdrawEvent: EventDef<Attributes, EventType.YieldWithdraw> = {
    name: EventType.YieldWithdraw,
    descriptionTrigger: 'fired on stablecoin yield withdraw actions',
    changelog: [{ version: '26.5.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        type: {
            changelog: [
                { version: '26.5.0', notes: 'added' },
                {
                    version: '26.5.2',
                    notes: 'added `leftPending`, `simulation-modal`, `firmware-upgrade-needed-modal` values',
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
