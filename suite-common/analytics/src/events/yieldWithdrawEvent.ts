import type { EarnModalAction } from '@suite-common/suite-types';

import { EventType } from '../constants';
import type { AttributeDef, EventDef } from '../eventDefinition';

type Attributes = {
    action: AttributeDef<EarnModalAction>;
    type: AttributeDef<
        | 'withdraw'
        | 'unwrap'
        | 'unwrap-success'
        | 'tx-simulation-modal'
        | 'success'
        | 'error'
        | 'leftPending'
        | 'firmware-upgrade-needed-modal'
    >;
    operation?: AttributeDef<'withdraw' | 'redeem'>;
    networkSymbol?: AttributeDef<string>;
    vaultId?: AttributeDef<string>;
    durationMs?: AttributeDef<number>;
    errorMessage?: AttributeDef<string>;
    apyBreakdown?: AttributeDef<string>;
    wrappedNative?: AttributeDef<boolean>;
};

export const yieldWithdrawEvent: EventDef<Attributes, EventType.YieldWithdraw> = {
    name: EventType.YieldWithdraw,
    descriptionTrigger: 'fired on stablecoin yield withdraw actions',
    changelog: [
        { version: '26.5.0', notes: 'added' },
        { version: '26.7.1', notes: 'moved to suite-common, reported from mobile as well' },
        { version: '26.8.0', notes: 'added unwrap transaction events' },
        { version: '26.9.0', notes: 'added pre-broadcast unwrap-step failures' },
    ],

    attributes: {
        action: {
            changelog: [{ version: '26.5.0', notes: 'added' }],
        },
        type: {
            description:
                'Which step of the withdraw flow the event refers to: `withdraw` = form submit, `tx-simulation-modal` = simulation modal shown (desktop only), `success` / `error` / `leftPending` = withdraw transaction resolution. `error` also covers a failure of the unwrap step — see `errorMessage`.',
            changelog: [
                { version: '26.5.0', notes: 'added' },
                {
                    version: '26.5.2',
                    notes: 'added `leftPending`, `tx-simulation-modal`, `firmware-upgrade-needed-modal` values',
                },
                { version: '26.8.0', notes: 'added `unwrap` and `unwrap-success` values' },
            ],
        },
        operation: {
            description:
                'Which ERC-4626 vault-exit operation the withdraw flow performed: `withdraw` (by underlying assets) or `redeem` (by vault shares). Reported on submit and resolution.',
            changelog: [{ version: '26.6.2', notes: 'added' }],
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
            description:
                'Values prefixed with `unwrap-` are failures of the unwrap step of a wrapped-native withdraw, all of them before the unwrap transaction is broadcast: `unwrap-submit-failed` (signing failed, or the user rejected the transaction on the device or in the review modal), `unwrap-push-failed` (signed but the broadcast failed), and `unwrap-<compose reason>` (e.g. `unwrap-fee-estimation-failed`) when the transaction could not be composed. An unwrap that fails on chain instead reports `on-chain-failure`, as does the withdraw transaction itself.',
            changelog: [
                { version: '26.5.0', notes: 'added' },
                { version: '26.9.0', notes: 'added `unwrap-` prefixed values' },
            ],
        },
        apyBreakdown: {
            description:
                'Per-component breakdown of the displayed APY as a single comma-separated string in `SYMBOL,APY,SYMBOL,APY,…` order, sorted alphabetically by symbol. APYs are decimal percentages (e.g. `USDT,3.45,MORPHO,0.5` means 3.45% paid in USDT plus 0.5% paid in MORPHO). Each reward component is emitted independently; if two components share a token symbol they appear twice in the string. Reported on `type=withdraw` (click/tap to submit) and `type=success` (withdraw confirmed).',
            changelog: [{ version: '26.5.2', notes: 'added' }],
        },
        wrappedNative: {
            description:
                'Whether the withdrawn vault token is the wrapped-native token of the network (e.g. WETH on Ethereum), meaning the withdraw involves a native unwrap step. Reported on `type=withdraw` (submit) and `type=success` (confirmed).',
            changelog: [
                { version: '26.8.0', notes: 'added' },
                { version: '26.8.1', notes: 'reported from mobile as well' },
            ],
        },
    },
};
