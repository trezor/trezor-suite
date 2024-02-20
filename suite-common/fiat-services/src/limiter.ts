import { differenceInMilliseconds } from 'date-fns';

import { scheduleAction } from '@trezor/utils';

export class RateLimiter {
    // Poor man's rate limiter
    // Slows down requests so there is `delayMs` gap between them
    private delayMs: number; // gap between each request
    private timeoutMs: number;
    private lastFetchTimestamp: number;
    private queued: number; // how many requests are waiting to be fired
    private totalDelay: number; // by how much time are we gonna slown down next request

    constructor(delayMs: number, timeoutMs: number) {
        this.delayMs = delayMs;
        this.timeoutMs = timeoutMs;

        this.lastFetchTimestamp = 0;
        this.queued = 0;
        this.totalDelay = 0;
    }

    async limit<T>(fn: (signal?: AbortSignal) => Promise<T>): Promise<T> {
        const msSinceLastFetch = differenceInMilliseconds(
            new Date().getTime(),
            this.lastFetchTimestamp,
        );
        if (msSinceLastFetch < this.delayMs) {
            this.queued += 1;
            this.totalDelay += this.delayMs;
            // dummy wait for this.totalDelay before we fire next request
            await new Promise(resolve => setTimeout(resolve, this.totalDelay)); // slow down firing next request
        }

        this.lastFetchTimestamp = new Date().getTime();
        const results = await scheduleAction(signal => fn(signal), { timeout: this.timeoutMs });
        this.queued -= 1;
        if (this.queued === 0) {
            // if all queued requests were fired, we need to reset totalDelay to properly delay next batch of requests
            this.totalDelay = 0;
        }

        return results;
    }
}
