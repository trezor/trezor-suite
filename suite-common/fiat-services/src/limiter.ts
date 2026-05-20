import { resolveAfter, scheduleAction } from '@trezor/utils';

// Poor man's rate limiter that slows down requests so there is a `delayMs` gap between them.
export class RateLimiter {
    private readonly delayMs: number; // gap between each request
    private readonly timeoutMs: number;

    private queue = Promise.resolve();
    private abortController = new AbortController();

    constructor(delayMs: number, timeoutMs: number) {
        this.delayMs = delayMs;
        this.timeoutMs = timeoutMs;
    }

    limit<T>(fn: (signal?: AbortSignal) => Promise<T>): Promise<T> {
        const limiterSignal = this.abortController.signal;
        const resultPromise = this.queue.then(
            async () =>
                await scheduleAction(signal => fn(signal), {
                    signal: limiterSignal,
                    timeout: this.timeoutMs,
                }),
        );

        this.queue = resultPromise
            .catch(error => console.error(error)) // ensure errors don't stop the queue
            .then(() => resolveAfter(this.delayMs));

        return resultPromise;
    }

    cancelPending() {
        this.abortController.abort();
        this.abortController = new AbortController();
        this.queue = Promise.resolve();
    }
}
