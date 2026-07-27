import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    element: AttributeDef<
        | 'apy-tooltip'
        | 'how-it-works'
        | 'earn-dashboard-claim-rewards'
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
        'fired on low-level UI interactions inside the stablecoin yield feature (tooltips, help sheets, educational modal tab expansions, max toggles)',
    changelog: [
        { version: '26.5.2', notes: 'added' },
        { version: '26.7.1', notes: 'moved to suite-common, reported from mobile as well' },
    ],

    attributes: {
        element: {
            description:
                'Which UI element the user interacted with — e.g. `apy-tooltip` = APY breakdown tooltip/alert, `how-it-works` = yield info modal (desktop), `earn-dashboard-claim-rewards` = claimable-rewards section on the mobile earn dashboard, `in-a-nutshell-process-tab` = deposit/withdraw/claim process timeline (modal tab on desktop, info bottom sheet on mobile), `withdraw-unit-toggle` = asset/shares input switch, `insufficient-funds-banner` = get-token button',
            changelog: [
                { version: '26.5.2', notes: 'added' },
                {
                    version: '26.7.1',
                    notes: 'added `earn-dashboard-claim-rewards` value (mobile)',
                },
            ],
        },
        value: {
            description:
                'Optional sub-identifier — for `in-a-nutshell-process-tab`: `deposit` | `withdraw` | `claim`; for `withdraw-unit-toggle`: the unit being switched to (`asset` = underlying deposit token, `shares` = vault receipt token); for `withdraw-max`: the current unit (`asset` | `shares`); for `pending-tx-open`: the pending tx type (`approve` | `revoke` | `deposit` | `withdraw` | `claim`); omitted for `deposit-max`',
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
