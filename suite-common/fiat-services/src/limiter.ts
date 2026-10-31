import { resolveAfter, scheduleAction } from '@trezor/utils';

export type RequestPriority = 'normal' | 'high';

const PRIORITY_RANK = {
    normal: 0,
    high: 1,
} satisfies Record<RequestPriority, number>;

type LimitOptions = {
    priority?: RequestPriority;
};

type Job = {
    priority: RequestPriority;
    run: () => Promise<boolean>;
};

// Poor man's rate limiter that slows down requests so there is a `delayMs` gap between them.
export class RateLimiter {
    private readonly delayMs: number; // gap between each request
    private readonly timeoutMs: number;

    private readonly jobs: Job[] = [];
    private isDraining = false;

    constructor(delayMs: number, timeoutMs: number) {
        this.delayMs = delayMs;
        this.timeoutMs = timeoutMs;
    }

    limit<T>(
        fn: (signal?: AbortSignal) => Promise<T>,
        signal?: AbortSignal,
        { priority = 'normal' }: LimitOptions = {},
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const run = async () => {
                if (signal?.aborted) {
                    reject(signal.reason);

                    return false;
                }

                try {
                    resolve(await scheduleAction(fn, { timeout: this.timeoutMs, signal }));
                } catch (error) {
                    // ensure errors don't stop the queue
                    if (!signal?.aborted) console.error(error);
                    reject(error);
                }

                return true;
            };

            this.enqueue({ priority, run });
        });
    }

    private enqueue(job: Job) {
        const firstLowerPriorityJobIndex = this.jobs.findIndex(
            ({ priority }) => PRIORITY_RANK[priority] < PRIORITY_RANK[job.priority],
        );

        if (firstLowerPriorityJobIndex === -1) {
            this.jobs.push(job);
        } else {
            this.jobs.splice(firstLowerPriorityJobIndex, 0, job);
        }

        this.drain();
    }

    private async drain() {
        if (this.isDraining) return;

        this.isDraining = true;
        for (let job = this.jobs.shift(); job; job = this.jobs.shift()) {
            const hasRun = await job.run();
            if (hasRun) {
                await resolveAfter(this.delayMs);
            }
        }
        this.isDraining = false;
    }
}
