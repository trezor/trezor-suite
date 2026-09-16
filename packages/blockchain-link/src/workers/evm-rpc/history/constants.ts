export const TRANSFER_TOPIC =
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' as const;

// Arc's free plan rejects anything over 10000 blocks per eth_getLogs, even though the endpoint
// served 20000 when probed - the cap depends on the plan behind the URL. The scanner learns a
// smaller cap from the provider's own error message, so this only needs to be a safe starting
// point rather than the exact truth.
export const LOG_CHUNK_BLOCKS = 10_000;

// What a first look at an account covers: one chunk, so two requests. Everything older is fetched
// only when the account view asks for it by passing `from`, one step at a time.
export const INITIAL_HISTORY_BLOCKS = LOG_CHUNK_BLOCKS;

// How much further back each "load older transactions" step reaches: ~12h at Arc's ~0.5s blocks.
export const HISTORY_STEP_BLOCKS = 83_397;

// Blocks at the tip are scanned but not marked as scanned, so the next sync covers them again.
// A block can be returned by eth_blockNumber before its logs are queryable - more so behind a load
// balancer - and marking it done would lose those logs until the worker restarts. Re-ingesting is
// idempotent (entries are keyed by txid), and at ~0.5s blocks this range is trivial.
export const TIP_LAG_BLOCKS = 2;

// Kept low because the public RPC answers -32005 well before it runs out of range.
export const MAX_LOG_CONCURRENCY = 3;
export const MAX_TX_CONCURRENCY = 4;

export const RATE_LIMIT_BACKOFF_MS = 1_000;
export const MAX_RATE_LIMIT_RETRIES = 4;

// Smallest chunk worth retrying with before giving up on a range.
export const MIN_LOG_CHUNK_BLOCKS = 128;

// Discovered contracts are balance-checked on every account refresh, so the list needs a ceiling;
// spam airdrops alone can push a testnet address past this.
export const MAX_DISCOVERED_TOKENS = 50;
