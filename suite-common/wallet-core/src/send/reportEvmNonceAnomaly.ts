import { type Scope, captureException, withScope } from '@sentry/core';

import { type AccountWithNetworkType } from '@suite-common/wallet-types';

/**
 * Sentry reporting for the EVM nonce resolution path (see `resolveEthereumNonce`).
 *
 * None of these conditions block signing — they exist because the failures they describe are
 * otherwise silent, and their real-world rate is unknown. Reports are deduplicated per signature
 * for the lifetime of the session, the same way `reportEthereumFeeEstimationError` is: a user
 * retrying a stuck send would otherwise emit the same event on every attempt.
 */
const reportedSignatures = new Set<string>();

type NonceAccount = Pick<AccountWithNetworkType<'ethereum'>, 'symbol' | 'accountType'>;

const reportOnce = (
    signature: string,
    errorCode: string,
    message: string,
    setTags: (scope: Scope) => void,
) => {
    if (reportedSignatures.has(signature)) {
        return;
    }
    reportedSignatures.add(signature);

    withScope(scope => {
        scope.setTag('error.code', errorCode);
        setTags(scope);
        captureException(new Error(message));
    });
};

/**
 * The backend nonce fetch failed, so signing falls back to reconstructing the nonce from local
 * state. Counting these tells us how often signing runs on the degraded path — and therefore
 * whether a retry would be worth the extra call.
 */
export const reportEvmNonceFetchFailed = ({
    account,
    reason,
}: {
    account: NonceAccount;
    reason: string;
}) =>
    reportOnce(
        ['fetch-failed', account.symbol, reason].join('|'),
        'evm_nonce_fetch_failed',
        `EVM confirmed-nonce fetch failed, falling back to local derivation [${reason}]`,
        scope => {
            scope.setTag('nonce.network', account.symbol);
            scope.setTag('nonce.accountType', account.accountType);
            scope.setExtra('reason', reason);
        },
    );

/**
 * The nonce about to be signed sits above what the backend's pending count and our own in-flight
 * txs can account for (see `getEvmPendingNonceCeiling`) — the shape of the #30910 incident.
 */
export const reportEvmNonceAbovePending = ({
    account,
    offeredNonce,
    pendingNonceCeiling,
    isCustomNonce,
}: {
    account: NonceAccount;
    offeredNonce: number;
    pendingNonceCeiling: number;
    isCustomNonce: boolean;
}) =>
    reportOnce(
        ['above-pending', account.symbol, offeredNonce, pendingNonceCeiling].join('|'),
        'evm_nonce_above_pending',
        `EVM nonce ${offeredNonce} exceeds pending ceiling ${pendingNonceCeiling}`,
        scope => {
            scope.setTag('nonce.network', account.symbol);
            scope.setTag('nonce.accountType', account.accountType);
            scope.setTag('nonce.isCustom', isCustomNonce);
            scope.setExtra('offeredNonce', offeredNonce);
            scope.setExtra('pendingNonceCeiling', pendingNonceCeiling);
        },
    );

/**
 * The backend's pending count runs ahead of the confirmed nonce by more than our own in-flight txs
 * explain, so transactions we cannot see are queued (see `hasUnknownPendingEvmTxs`).
 */
export const reportEvmUnknownPendingTxs = ({
    account,
    pendingNonce,
    confirmedNonce,
    ownPendingCount,
}: {
    account: NonceAccount;
    pendingNonce: number;
    confirmedNonce: number;
    ownPendingCount: number;
}) =>
    reportOnce(
        ['unknown-pending', account.symbol, pendingNonce, confirmedNonce].join('|'),
        'evm_nonce_unknown_pending',
        `EVM pending nonce ${pendingNonce} exceeds confirmed ${confirmedNonce} plus ${ownPendingCount} known pending`,
        scope => {
            scope.setTag('nonce.network', account.symbol);
            scope.setTag('nonce.accountType', account.accountType);
            scope.setExtra('pendingNonce', pendingNonce);
            scope.setExtra('confirmedNonce', confirmedNonce);
            scope.setExtra('ownPendingCount', ownPendingCount);
        },
    );

/**
 * An EVM transaction in the store has no `details.vin`, which makes `isSignedByAccount` drop it
 * from the nonce sets. Every producer fills it today (`transformTransaction`, and
 * `buildFakePendingEvmTx` via `isAccountOwned`), so this firing means one has regressed.
 */
export const reportEvmTransactionWithoutVin = ({
    account,
    count,
}: {
    account: NonceAccount;
    count: number;
}) =>
    reportOnce(
        ['missing-vin', account.symbol].join('|'),
        'evm_transaction_without_vin',
        `${count} EVM transaction(s) in the store have no details.vin and are invisible to nonce arithmetic`,
        scope => {
            scope.setTag('nonce.network', account.symbol);
            scope.setTag('nonce.accountType', account.accountType);
            scope.setExtra('count', count);
        },
    );
