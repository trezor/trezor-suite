import { erc20Abi, getAbiItem, toEventSelector } from 'viem';

import { RPC_BATCH_SIZE } from '../constants';

export const TRANSFER_EVENT = getAbiItem({ abi: erc20Abi, name: 'Transfer' });

// Taken from the same ABI item the logs are decoded with, so the eth_getLogs filter cannot drift
// from what the parser accepts.
export const TRANSFER_TOPIC = toEventSelector(TRANSFER_EVENT);

// Arc's free plan rejects anything over 10000 blocks per eth_getLogs, even though the endpoint
// served 20000 when probed - the cap depends on the plan behind the URL. The scanner learns a
// smaller cap from the provider's own error message, so this only needs to be a safe starting
// point rather than the exact truth.
export const LOG_CHUNK_BLOCKS = 10_000;

// What a first look at an account covers: one chunk, so two requests. Everything older is fetched
// only when the account view asks for it by passing `from`, one step at a time.
export const INITIAL_HISTORY_BLOCKS = LOG_CHUNK_BLOCKS;

// How much further back each "load older transactions" step reaches: ~7 days at Arc's ~0.506s
// blocks, 120 chunks per direction, which batching sends as two HTTP requests.
export const HISTORY_STEP_BLOCKS = 1_200_000;

// Blocks at the tip are scanned but not marked as scanned, so the next sync covers them again.
// A block can be returned by eth_blockNumber before its logs are queryable - more so behind a load
// balancer - and marking it done would lose those logs until the worker restarts. Re-ingesting is
// idempotent (entries are keyed by txid), and at ~0.5s blocks this range is trivial.
export const TIP_LAG_BLOCKS = 2;

// The transport splits whatever is in flight into batches that travel in parallel, so a whole
// history step (240 queries) goes out at once instead of waiting for the first batch to return.
export const MAX_LOG_CONCURRENCY = 2 * RPC_BATCH_SIZE;
// A transaction costs two reads (body and receipt), so a page of them fits in one batch.
export const MAX_TX_CONCURRENCY = RPC_BATCH_SIZE / 2;

export const RATE_LIMIT_BACKOFF_MS = 1_000;
export const MAX_RATE_LIMIT_RETRIES = 4;

// Smallest chunk worth retrying with before giving up on a range.
export const MIN_LOG_CHUNK_BLOCKS = 128;

// Discovered contracts are balance-checked on every account refresh, so the list needs a ceiling;
// spam airdrops alone can push a testnet address past this.
export const MAX_DISCOVERED_TOKENS = 50;
