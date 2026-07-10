import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    action: AttributeDef<'continue' | 'cancel'>;
    type: AttributeDef<'unwrap-form-modal' | 'tx-simulation-modal' | 'unwrap' | 'error'>;
    networkSymbol?: AttributeDef<string>;
    source?: AttributeDef<'tokens-table' | 'withdraw-complete'>;
    errorMessage?: AttributeDef<string>;
};

export const wethUnwrapEvent: EventDef<Attributes, EventType.YieldWethUnwrap> = {
    name: EventType.YieldWethUnwrap,
    descriptionTrigger: 'fired on WETH unwrap actions (modal open/cancel, submit, errors)',
    changelog: [{ version: '26.7.0', notes: 'added' }],

    attributes: {
        action: {
            changelog: [{ version: '26.7.0', notes: 'added' }],
        },
        type: {
            description:
                '`unwrap-form-modal` = unwrap modal opened or cancelled, `tx-simulation-modal` = simulation accepted/cancelled, `unwrap` = transaction submitted, `error` = submit failed',
            changelog: [{ version: '26.7.0', notes: 'added' }],
        },
        networkSymbol: {
            changelog: [{ version: '26.7.0', notes: 'added' }],
        },
        source: {
            description: 'Entry point of the unwrap flow',
            changelog: [{ version: '26.7.0', notes: 'added' }],
        },
        errorMessage: {
            changelog: [{ version: '26.7.0', notes: 'added' }],
        },
    },
};
