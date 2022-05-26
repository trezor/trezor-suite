import type { PollingPrefixKeyValues } from '@wallet-constants/polling';

export type PollingKeyPrefix = typeof PollingPrefixKeyValues[number];
export type PollingKey = `${PollingKeyPrefix}/${string}`;
export type Polling = {
    pollingFunction: () => void;
    intervalMs: number;
    timeoutId?: number;
    counter: number;
    maxPollingRequestCount: number;
};
