import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    element: AttributeDef<
        | 'apy-tooltip'
        | 'how-it-works'
        | 'earn-dashboard-claim-rewards'
        | 'in-a-nutshell-process-tab'
        | 'withdraw-unit-toggle'
        | 'amount-currency-toggle'
        | 'deposit-max'
        | 'withdraw-max'
        | 'wrap-max'
        | 'unwrap-max'
        | 'pending-tx-open'
        | 'show-more-accounts'
        | 'feedback-submit'
        | 'insufficient-funds-banner'
        | 'allowance-error-banner'
        | 'allowance-retry'
        | 'fee-estimation-error-banner'
        | 'fee-unavailable-banner'
        | 'fee-estimation-retry'
        | 'fee-estimation-recovered'
    >;
    value?: AttributeDef<string>;
    networkSymbol?: AttributeDef<string>;
    vaultId?: AttributeDef<string>;
};

export const yieldInteractionEvent: EventDef<Attributes, EventType.YieldInteraction> = {
    name: EventType.YieldInteraction,
    descriptionTrigger:
        'Low-level UI interactions inside yield and wrapped-native forms (tooltips, help sheets, educational modal tab expansions, max toggles). Mobile Earn also reports fee error banner presentation, explicit retry and usable recovery across staking, yield and wrap/unwrap forms; these fee elements are UI state transitions, not transaction outcomes.',
    changelog: [
        { version: '26.5.2', notes: 'added' },
        { version: '26.7.1', notes: 'moved to suite-common, reported from mobile as well' },
        {
            version: '26.11.1',
            notes: 'Reused for mobile Earn fee error banners, retry and recovery; no new event or attributes.',
        },
    ],

    attributes: {
        element: {
            description:
                'Which UI element the user interacted with — e.g. `apy-tooltip` = APY breakdown tooltip/alert, `how-it-works` = yield info modal (desktop), `earn-dashboard-claim-rewards` = claimable-rewards section on the mobile earn dashboard, `in-a-nutshell-process-tab` = deposit/withdraw/claim process timeline (modal tab on desktop, info bottom sheet on mobile), `withdraw-unit-toggle` = asset/shares input switch, `amount-currency-toggle` = crypto/fiat amount input switch (any yield amount form; no `vaultId` on the standalone wrap/unwrap forms, which are not tied to a vault), `insufficient-funds-banner` = get-token button. The max-button values name the form the button belongs to: `deposit-max` / `withdraw-max` cover the deposit and withdraw forms including their in-flow wrap/unwrap steps, while `wrap-max` / `unwrap-max` are the standalone wrap/unwrap pages (no `vaultId`). Mobile Earn fee elements: `fee-estimation-error-banner` = fee preparation failed; `fee-unavailable-banner` = the selected fee cannot be used (e.g. insufficient funds or reserve); `fee-estimation-retry` = explicit retry; `fee-estimation-recovered` = the fee becomes usable after a failure. Initial success is not reported. Failures are deduplicated until explicit retry or recovery, including across transient invalid input or screen blur. Fee events contain no wallet identifiers, amounts or raw error text.',
            changelog: [
                { version: '26.5.2', notes: 'added' },
                {
                    version: '26.7.1',
                    notes: 'added `earn-dashboard-claim-rewards` value (mobile)',
                },
                {
                    version: '26.8.0',
                    notes: 'added `amount-currency-toggle`, `wrap-max`, `unwrap-max` values (desktop)',
                },
                {
                    version: '26.8.1',
                    notes: '`wrap-max` / `unwrap-max` / `amount-currency-toggle` reported from mobile as well; mobile now also reports `deposit-max` from the approval and in-flow wrap steps and `withdraw-max` from the in-flow unwrap step, which previously reported no max event',
                },
                {
                    version: '26.11.0',
                    notes: '`pending-tx-open` also reports explicit mobile explorer opens from yield pending sheets; automatic sheet presentation is not an interaction',
                },
                {
                    version: '26.11.1',
                    notes: 'Added mobile Earn fee error banner, retry and recovery elements.',
                },
            ],
        },
        value: {
            description:
                'Optional sub-identifier — for `in-a-nutshell-process-tab`: `deposit` | `withdraw` | `claim`; for `withdraw-unit-toggle`: the unit being switched to (`asset` = underlying deposit token, `shares` = vault receipt token); for `amount-currency-toggle`: the input unit being switched to (`crypto` | `fiat`); for `withdraw-max`: the current unit (`asset` | `shares`); for `pending-tx-open`: the pending tx type (`approve` | `revoke` | `deposit` | `withdraw` | `redeem` | `claim` | `wrap` | `unwrap`), opening in-app details on desktop or the explorer on mobile; omitted for `deposit-max`, `wrap-max` and `unwrap-max`. For the mobile fee elements only: the same operation label as `transaction/broadcast-status` (`stake` | `unstake` | `claim` | `withdraw` | `approve` | `revoke` | `merkl-claim` | `yield-deposit` | `yield-withdraw` | `yield-redeem` | `wrap` | `unwrap`); no numeric fee values.',
            changelog: [
                { version: '26.5.2', notes: 'added' },
                {
                    version: '26.8.0',
                    notes: 'added `amount-currency-toggle` values (`crypto` | `fiat`)',
                },
                {
                    version: '26.11.1',
                    notes: 'Fee elements use the fixed mobile Earn operation as value.',
                },
            ],
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
