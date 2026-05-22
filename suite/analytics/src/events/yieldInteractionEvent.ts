import type { AttributeDef, EventDef } from '@suite-common/analytics';

import { EventType } from '../constants';

type Attributes = {
    element: AttributeDef<
        | 'apy-tooltip'
        | 'how-it-works'
        | 'in-a-nutshell-process-tab'
        | 'withdraw-unit-toggle'
        | 'deposit-max'
        | 'withdraw-max'
        | 'pending-tx-open'
        | 'show-more-accounts'
        | 'feedback-submit'
        | 'insufficient-funds-banner'
        | 'allowance-error-banner'
        | 'allowance-retry'
    >;
    value?: AttributeDef<string>;
    networkSymbol?: AttributeDef<string>;
    vaultId?: AttributeDef<string>;
};

export const yieldInteractionEvent: EventDef<Attributes, EventType.YieldInteraction> = {
    name: EventType.YieldInteraction,
    descriptionTrigger:
        'fired on low-level UI interactions inside the stablecoin yield feature (tooltips, help buttons, educational modal tab expansions)',
    changelog: [{ version: '26.5.2', notes: 'added' }],

    attributes: {
        element: {
            description: 'Which UI element the user interacted with',
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
        value: {
            description:
                'Optional sub-identifier — for `in-a-nutshell-process-tab`: `deposit` | `withdraw` | `claim`; for `withdraw-unit-toggle`: the unit being switched to (`asset` = underlying deposit token, `shares` = vault receipt token); for `withdraw-max`: the current unit (`asset` | `shares`); for `pending-tx-open`: the pending tx type (`approve` | `revoke` | `revoke-only` | `deposit` | `withdraw` | `claim`); omitted for `deposit-max`',
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
        networkSymbol: {
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
        vaultId: {
            description: 'Internal vault identifier (vault.id), when in vault context',
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
    },
};
