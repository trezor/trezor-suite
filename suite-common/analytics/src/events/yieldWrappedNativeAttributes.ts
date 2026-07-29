import type { EarnModalAction } from '@suite-common/suite-types';

import type { AttributeDef } from '../eventDefinition';

/**
 * Shared attribute schema for the native-token wrap (ETH → WETH) and unwrap (WETH → ETH) flows.
 * Both `yieldWrapEvent` and `yieldUnwrapEvent` are structurally identical, so they reuse this
 * single type + metadata object.
 *
 * Fired from the standalone Wrap/Unwrap pages (no `vaultId`) and, as an in-flow step, from the
 * yield deposit/withdraw flows for wrapped-native vaults (`vaultId` set to the vault being
 * deposited into / withdrawn from).
 *
 * Deliberately carries NO amount/balance/txid/descriptor — those are device-confidential and must
 * never leave the device (see CLAUDE.md), mirroring `yieldDepositEvent` / `yieldWithdrawEvent`.
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
        changelog: [{ version: '26.8.0', notes: 'added' }],
    },
    type: {
        description:
            '`submit` = user confirmed the wrap/unwrap form, `tx-simulation-modal` = simulation modal shown (with `action` continue/cancel), `sent` = transaction signed &amp; broadcast accepted (the "transaction sent" toast is shown), `success` / `error` / `leftPending` = on-chain resolution of the broadcast transaction',
        changelog: [{ version: '26.8.0', notes: 'added' }],
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
            'Classified failure reason. On compose failure, the specific compose reason (e.g. `unsupported-network`, `not-wrapped-native`, `missing-chain-id`, `missing-fee-level`, `fee-estimation-failed`). On submit failure, `submit-failed` (signing/review cancelled or failed) or `push-failed` (broadcast rejected by backend). On on-chain revert, `on-chain-failure`.',
        changelog: [{ version: '26.8.0', notes: 'added' }],
    },
} satisfies WrappedNativeFlowAttributes;
