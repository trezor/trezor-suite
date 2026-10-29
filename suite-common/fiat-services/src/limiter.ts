import { resolveAfter, scheduleAction } from '@trezor/utils';

// Poor man's rate limiter that slows down requests so there is a `delayMs` gap between them.
export class RateLimiter {
    private readonly delayMs: number; // gap between each request
    private readonly timeoutMs: number;

    private queue = Promise.resolve();

    constructor(delayMs: number, timeoutMs: number) {
        this.delayMs = delayMs;
        this.timeoutMs = timeoutMs;
    }

    limit<T>(fn: (signal?: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<T> {
        let isSkipped = false;
        const resultPromise = this.queue.then(async () => {
            if (signal?.aborted) {
                isSkipped = true;
                throw signal.reason;
            }

            return await scheduleAction(fn, { timeout: this.timeoutMs, signal });
        });

        this.queue = resultPromise
            .catch(error => {
                // ensure errors don't stop the queue
                if (!signal?.aborted) console.error(error);
            })
            .then(() => (isSkipped ? undefined : resolveAfter(this.delayMs)));

        return resultPromise;
    }
}
