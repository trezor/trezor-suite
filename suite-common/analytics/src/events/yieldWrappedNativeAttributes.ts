import type { EarnModalAction } from '@suite-common/suite-types';

import type { AttributeDef } from '../eventDefinition';

/**
 * Shared by `yieldWrapEvent` and `yieldUnwrapEvent`, which are structurally identical.
 *
 * Carries no amount/balance/txid/descriptor — those are device-confidential and must never leave
 * the device (see CLAUDE.md).
 */
export type WrappedNativeFlowAttributes = {
    action: AttributeDef<EarnModalAction>;
    type: AttributeDef<
        'submit' | 'tx-simulation-modal' | 'sent' | 'success' | 'error' | 'leftPending'
    >;
    networkSymbol?: AttributeDef<string>;
    vaultId?: AttributeDef<string>;
    durationMs?: AttributeDef<number>;
    errorMessage?: AttributeDef<string>;
};

export const wrappedNativeFlowAttributes = {
    action: {
        description:
            'What the user did with the surface the `type` names. `continue` on every lifecycle report; `cancel` when the tx-simulation modal was declined; `close` when the "transaction sent" toast was dismissed with its dismiss button.',
        changelog: [{ version: '26.8.0', notes: 'added' }],
    },
    type: {
        description:
            '`submit` = user confirmed the wrap/unwrap form, `tx-simulation-modal` = simulation modal shown (with `action` continue/cancel), `sent` = transaction signed &amp; broadcast accepted — emitted with `action=continue` when the "transaction sent" toast is shown and again with `action=close` if the user dismisses that toast (letting it auto-close is not reported), `success` / `error` / `leftPending` = on-chain resolution of the broadcast transaction. Mobile shows a pending-transaction sheet instead of a toast and only reports `sent` with `action=continue`.',
        changelog: [
            { version: '26.8.0', notes: 'added' },
            { version: '26.8.1', notes: 'reported from mobile as well' },
        ],
    },
    networkSymbol: {
        changelog: [{ version: '26.8.0', notes: 'added' }],
    },
    vaultId: {
        description:
            'Internal vault identifier (vault.id) when the wrap/unwrap runs as an in-flow step of a yield deposit/withdraw; absent for the standalone wrap/unwrap pages.',
        changelog: [{ version: '26.8.0', notes: 'added' }],
    },
    durationMs: {
        description:
            'Milliseconds between broadcast (tx appearing in state) and resolution (success / error / leftPending)',
        changelog: [{ version: '26.8.0', notes: 'added' }],
    },
    errorMessage: {
        description:
            'Classified failure reason. On compose failure, the specific compose reason (e.g. `unsupported-network`, `not-wrapped-native`, `missing-chain-id`, `missing-fee-level`, `fee-estimation-failed`). On submit failure, `submit-failed` (signing/review cancelled or failed) or `push-failed` (broadcast rejected by backend). On on-chain revert, `on-chain-failure`. Mobile reports only `submit-failed`, `push-failed` and `on-chain-failure` — the form composes continuously in the background, so compose failures are not surfaced as an event.',
        changelog: [
            { version: '26.8.0', notes: 'added' },
            { version: '26.8.1', notes: 'reported from mobile as well' },
        ],
    },
} satisfies WrappedNativeFlowAttributes;
