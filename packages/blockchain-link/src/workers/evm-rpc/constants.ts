export const TOKEN_DISCOVERY = {
    CHUNK_SIZE: 10000,
    MAX_BLOCKS_TO_CHECK: 1000000,
} as const;

export const BLOCK_SUBSCRIPTION = {
    POLL_INTERVAL_MS: 10000,
} as const;

export const EIP1559_BLOCKS_TO_ANALYZE = 4;
export const EIP1559_PERCENTILES = [20, 70, 90, 99];
