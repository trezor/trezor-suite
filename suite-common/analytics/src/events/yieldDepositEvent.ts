import type { EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    type: AttributeDef<
        | 'approve'
        | 'approve-modal'
        | 'approve-success'
        | 'approve-skipped'
        | 'revoke'
        | 'revoke-modal'
        | 'revoke-success'
        | 'modify-allowance'
        | 'wrap'
        | 'wrap-success'
        | 'deposit'
        | 'tx-simulation-modal'
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
    apyBreakdown?: AttributeDef<string>;
    wrappedNative?: AttributeDef<boolean>;
};

export const yieldDepositEvent: EventDef<Attributes, EventType.YieldDeposit> = {
    name: EventType.YieldDeposit,
    descriptionTrigger: 'fired on stablecoin yield deposit actions',
    changelog: [
        { version: '26.5.0', notes: 'added (as yield/supply)' },
        { version: '26.5.2', notes: 'renamed from yield/supply to yield/deposit' },
        { version: '26.7.1', notes: 'moved to suite-common, reported from mobile as well' },
        { version: '26.8.0', notes: 'added wrap transaction events' },
        { version: '26.9.0', notes: 'added pre-broadcast wrap-step failures' },
    ],

    attributes: {
        action: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        type: {
            description:
                '`approve-skipped` = user skipped the approval step to continue with the allowance already granted — distinct from `type=approve` `action=cancel` (cancelled before submitting the allowance transaction) and `type=approve-modal` `action=cancel` (declined the allowance simulation modal)',
            changelog: [
                { version: '26.5.0', notes: 'added' },
                {
                    version: '26.5.2',
                    notes: 'added `approve-success`, `revoke-success`, `leftPending`, `tx-simulation-modal`, `firmware-upgrade-needed-modal` values',
                },
                { version: '26.8.0', notes: 'added `wrap` and `wrap-success` values' },
                { version: '26.8.1', notes: 'added `approve-skipped` value (mobile)' },
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
                "Type of allowance selected by the user: 'MINIMAL' = exact amount for this deposit, 'INFINITE' = unlimited allowance",
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
        durationMs: {
            description:
                'Milliseconds between submission (pending tx appearing in state) and resolution (success / error / leftPending)',
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
        errorMessage: {
            description:
                'Values prefixed with `wrap-` are failures of the wrap step of a wrapped-native deposit, all of them before the wrap transaction is broadcast: `wrap-submit-failed` (signing failed, or the user rejected the transaction on the device or in the review modal), `wrap-push-failed` (signed but the broadcast failed), and `wrap-<compose reason>` (e.g. `wrap-fee-estimation-failed`) when the transaction could not be composed. A wrap that fails on chain instead reports `on-chain-failure`, as does the deposit transaction itself.',
            changelog: [
                { version: '26.5.0', notes: 'added' },
                { version: '26.9.0', notes: 'added `wrap-` prefixed values' },
                {
                    version: '26.9.0',
                    notes: 'desktop no longer reports user cancellations of the deposit transaction (device button, PIN entry, review modal) as `submit-failed`',
                },
            ],
        },
        apyBreakdown: {
            description:
                'Per-component breakdown of the displayed APY as a single comma-separated string in `SYMBOL,APY,SYMBOL,APY,…` order, sorted alphabetically by symbol. APYs are decimal percentages (e.g. `USDT,3.45,MORPHO,0.5` means 3.45% paid in USDT plus 0.5% paid in MORPHO). Each reward component is emitted independently; if two components share a token symbol they appear twice in the string. Reported on `type=deposit` (click/tap to submit) and `type=success` (deposit confirmed).',
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
        wrappedNative: {
            description:
                'Whether the deposited vault token is the wrapped-native token of the network (e.g. WETH on Ethereum), meaning the deposit involves a native wrap step. Reported on `type=deposit` (submit) and `type=success` (confirmed).',
            changelog: [
                { version: '26.8.0', notes: 'added' },
                { version: '26.8.1', notes: 'reported from mobile as well' },
            ],
        },
    },
};
