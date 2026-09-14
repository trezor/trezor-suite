// A key-value lookup with no enumeration, capped at 200 keys per request.
// https://developers.stellar.org/docs/data/rpc/api-reference/methods/getLedgerEntries
export const STELLAR_RPC_MAX_LEDGER_KEYS = 200;

// `sendTransaction` answers PENDING immediately, so apply-time failures only show by polling
// `getTransaction`; the budget bounds how long a send blocks before reporting the hash alone.
export const STELLAR_RPC_SUBMIT_POLL_INTERVAL_MS = 1000;
export const STELLAR_RPC_SUBMIT_POLL_TIMEOUT_MS = 30_000;

// TRY_AGAIN_LATER means the node is congested rather than the transaction being invalid.
export const STELLAR_RPC_SUBMIT_RETRY_ATTEMPTS = 3;
export const STELLAR_RPC_SUBMIT_RETRY_DELAY_MS = 1000;

/**
 * Over RPC alone Suite can only report trustlines whose `CODE-ISSUER` it already knows, so an
 * account holding an asset outside the curated definitions would silently lose it. Horizon's
 * `GET /accounts/{id}` enumerates them for one request on the same origin, so it stays the default
 * until the allow-list path has been measured against real accounts.
 */
export type StellarTrustlineDiscovery = 'horizon' | 'rpc';

export const STELLAR_TRUSTLINE_DISCOVERY: StellarTrustlineDiscovery = 'horizon';

/**
 * Account state is read over RPC — the node's own view of the current ledger, and the only source
 * that can also reach Soroban contract storage. That makes RPC a single point of failure, so a read
 * that fails to answer degrades to Horizon rather than leaving the account unloadable, reporting
 * the classic and native holdings Horizon can see. Submission stays RPC-only: the two paths report
 * different result codes, and doubling that surface for a rare case is not worth it.
 */
export type StellarRpcReadFallback = 'horizon' | 'off';

export const STELLAR_RPC_READ_FALLBACK: StellarRpcReadFallback = 'horizon';

/**
 * `getLatestLedger` cannot be asked for less than it sends: alongside the 572-byte `headerXdr` that
 * is all Suite reads, the node returns the whole ledger close meta — 2.8-3.7 MB decoded (~330 KB
 * gzipped) against `xlm.trezor.io`, where Horizon's `GET /ledgers?order=desc&limit=1` serves the
 * same four fields in 774 bytes with no XDR to decode, and the block subscription polls every 15
 * seconds. Horizon reports the latest *ingested* ledger, so it can trail RPC by a ledger or so —
 * immaterial for a base reserve that has changed once in the network's history.
 */
export type StellarLedgerHeadSource = 'horizon' | 'rpc';

export const STELLAR_LEDGER_HEAD_SOURCE: StellarLedgerHeadSource = 'horizon';
