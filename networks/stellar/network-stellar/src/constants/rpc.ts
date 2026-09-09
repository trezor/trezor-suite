// `getLedgerEntries` is a key-value lookup with no enumeration and accepts at most 200 keys
// per request, so a wide account has to be read in several batches.
// https://developers.stellar.org/docs/data/rpc/api-reference/methods/getLedgerEntries
export const STELLAR_RPC_MAX_LEDGER_KEYS = 200;

// `sendTransaction` answers PENDING immediately, so apply-time failures are only visible by
// polling `getTransaction`. The budget bounds how long a send may block before Suite falls back
// to reporting the hash alone.
export const STELLAR_RPC_SUBMIT_POLL_INTERVAL_MS = 1000;
export const STELLAR_RPC_SUBMIT_POLL_TIMEOUT_MS = 30_000;

// TRY_AGAIN_LATER means the node is congested rather than the transaction being invalid.
export const STELLAR_RPC_SUBMIT_RETRY_ATTEMPTS = 3;
export const STELLAR_RPC_SUBMIT_RETRY_DELAY_MS = 1000;

/**
 * Where the list of an account's trustlines comes from.
 *
 * `getLedgerEntries` is a key-value lookup, so over RPC alone Suite can only report trustlines
 * whose `CODE-ISSUER` it already knows — an account holding an asset outside the curated
 * definitions would silently lose it. Horizon's `GET /accounts/{id}` enumerates them, costs one
 * request on the same origin, and removes that regression, so it stays the default until the
 * allow-list path has been measured against real accounts.
 */
export type StellarTrustlineDiscovery = 'horizon' | 'rpc';

export const STELLAR_TRUSTLINE_DISCOVERY: StellarTrustlineDiscovery = 'horizon';

/**
 * Whether a failed Stellar RPC read falls back to Horizon.
 *
 * Account state moved onto RPC because Horizon cannot see Soroban contract storage. That made RPC
 * a single point of failure for the whole account, where Horizon used to serve balances — so a
 * read that fails to answer degrades to Horizon instead of leaving the account unloadable. The
 * degraded read reports classic and native holdings only; contract-token balances live in contract
 * storage and are simply absent. Submission stays RPC-only: the two paths report different result
 * codes, and doubling that surface for a rare case is not worth it.
 */
export type StellarRpcReadFallback = 'horizon' | 'off';

export const STELLAR_RPC_READ_FALLBACK: StellarRpcReadFallback = 'horizon';

/**
 * Where the ledger head (block height, hash, base reserve) is read from.
 *
 * Stellar RPC has no way to ask `getLatestLedger` for less than it wants to send: the node returns
 * `metadataXdr`, the whole ledger close meta, alongside the 572-byte `headerXdr` that is the only
 * part Suite reads. Measured against `xlm.trezor.io` that is 2.8-3.7 MB decoded (~330 KB gzipped)
 * per call, against 774 bytes (~620 gzipped) for the same four fields — and the block subscription
 * polls it every 15 seconds for the lifetime of the worker.
 *
 * Horizon's `GET /ledgers?order=desc&limit=1` serves all four fields directly, base reserve
 * included, with no XDR to decode. It reports the latest *ingested* ledger, so it can trail RPC by
 * a ledger or so; at a 15-second poll, and for a reserve that has changed once in the network's
 * history, that is not a difference Suite can act on.
 */
export type StellarLedgerHeadSource = 'horizon' | 'rpc';

export const STELLAR_LEDGER_HEAD_SOURCE: StellarLedgerHeadSource = 'horizon';

/**
 * Whether transaction history is enriched with the account's Horizon effects.
 *
 * The operations resource says what was *asked* for, not what moved: Horizon pre-decodes the
 * classic operations, and of the twenty-six types Suite reads four, so a path payment — the shape
 * every swap aggregator submits — arrives as an unrecognised operation with no amount at all.
 * Effects are the ledger's own account of what happened to the balance, so one
 * `GET /accounts/{id}/effects` per operations window gives every operation type, enumerated or
 * not, a real amount and counterparty.
 *
 * It costs one request per window, issued in parallel with the operations request — the effects
 * cursor is derivable from the operations cursor, so nothing serializes — and small next to the
 * operations response, which carries the envelope and result meta XDR of every joined transaction.
 * Effects per operation are unbounded, so a window can out-run the record limit; an operation the
 * effects read does not reach is described from its operation alone, and so is every operation of
 * a window whose effects request failed.
 */
export type StellarHistoryEffects = 'horizon' | 'off';

export const STELLAR_HISTORY_EFFECTS: StellarHistoryEffects = 'horizon';

// Effects per operation are unbounded, so the widest window Horizon allows is the cheap side of
// the trade.
export const STELLAR_HISTORY_EFFECTS_LIMIT = 200;
