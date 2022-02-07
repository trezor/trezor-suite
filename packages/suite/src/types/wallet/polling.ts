import type { PollingPrefixKeyValues } from '@wallet-constants/polling';

export type PollingKeyPrefix = typeof PollingPrefixKeyValues[number];
export type Polling = {
    pollingFunction: () => void;
    intervalMs: number;
    timeoutId?: number;
};
