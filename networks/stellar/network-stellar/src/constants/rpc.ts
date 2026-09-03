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
