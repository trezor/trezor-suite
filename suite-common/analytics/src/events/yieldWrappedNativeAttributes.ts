import type { EarnModalAction } from '@suite-common/suite-types';

import { type EarnDeviceStatus, deviceStatusAttribute } from '../earnAttributes';
import type { AttributeDef } from '../eventDefinition';

/**
 * Shared by `yieldWrapEvent` and `yieldUnwrapEvent`, which are structurally identical.
 *
 * These events cover only the standalone wrap/unwrap pages — a wrap/unwrap running as an in-flow
 * step of a yield deposit/withdraw reports through `yield/deposit` / `yield/withdraw` instead.
 *
 * Carries no amount/balance/txid/descriptor — those are device-confidential and must never leave
 * the device (see CLAUDE.md).
 */
export type WrappedNativeFlowAttributes = {
    action: AttributeDef<EarnModalAction>;
    deviceStatus?: AttributeDef<EarnDeviceStatus>;
    type: AttributeDef<
        'submit' | 'tx-simulation-modal' | 'sent' | 'success' | 'error' | 'leftPending'
    >;
    networkSymbol?: AttributeDef<string>;
    durationMs?: AttributeDef<number>;
    errorMessage?: AttributeDef<string>;
};

export const wrappedNativeFlowAttributes = {
    deviceStatus: deviceStatusAttribute,
    action: {
        description:
            'What the user did with the surface the `type` names. `continue` on every lifecycle report; `cancel` when the tx-simulation modal was declined; `close` when the "transaction sent" toast was dismissed with its dismiss button.',
        changelog: [{ version: '26.8.0', notes: 'added' }],
    },
    type: {
        description:
            '`submit` = user confirmed the wrap/unwrap form, `tx-simulation-modal` = simulation modal shown (with `action` continue/cancel), `sent` = transaction signed &amp; broadcast accepted — emitted with `action=continue` when the "transaction sent" toast is shown and again with `action=close` if the user dismisses that toast (letting it auto-close is not reported), `success` / `leftPending` = on-chain resolution of the broadcast transaction, `error` = a pre-broadcast or on-chain failure — see `errorMessage` for the classification. Mobile shows a pending-transaction sheet instead of a toast and only reports `sent` with `action=continue`.',
        changelog: [
            { version: '26.8.0', notes: 'added' },
            { version: '26.8.1', notes: 'reported from mobile as well' },
            {
                version: '26.11.0',
                notes: 'Mobile simulation cancellation includes backdrop and gesture dismissal exactly once and excludes dismissal after Continue.',
            },
        ],
    },
    networkSymbol: {
        changelog: [{ version: '26.8.0', notes: 'added' }],
    },
    durationMs: {
        description:
            'Milliseconds between broadcast (tx appearing in state) and resolution (success / error / leftPending)',
        changelog: [{ version: '26.8.0', notes: 'added' }],
    },
    errorMessage: {
        description:
            'Classified failure reason. On compose failure, the specific compose reason (e.g. `unsupported-network`, `not-wrapped-native`, `missing-chain-id`, `missing-fee-level`, `fee-estimation-failed`). On submit failure, `submit-failed` (unexpected failure) or `push-failed` (broadcast rejected by backend). Intentional signing/review cancellations use `transaction/cancel` instead of an error. On on-chain revert, `on-chain-failure`. Mobile preserves the same compose reasons; repeated background failures with the same reason are reported once until recovery or an explicit fee retry. Stale results and unmounted forms do not report failures.',
        changelog: [
            { version: '26.8.0', notes: 'added' },
            { version: '26.8.1', notes: 'reported from mobile as well' },
            {
                version: '26.11.0',
                notes: 'User cancellations no longer report submit-failed; mobile also reports classified compose errors.',
            },
        ],
    },
} satisfies WrappedNativeFlowAttributes;
