export const BLOCK_SUBSCRIPTION = {
    POLL_INTERVAL_MS: 10000,
} as const;

export const EIP1559_BLOCKS_TO_ANALYZE = 4;
export const EIP1559_PERCENTILES = [20, 70, 90, 99];

// arc.trezor.io answered 200 eth_getLogs in one batch in ~1.2 s, well inside viem's 10 s timeout.
export const RPC_BATCH_SIZE = 200;
