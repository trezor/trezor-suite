import { resolveAfter, scheduleAction } from '@trezor/utils';

export type RequestPriority = 'normal' | 'high';

const PRIORITY_RANK = {
    normal: 0,
    high: 1,
} satisfies Record<RequestPriority, number>;

type LimitOptions = {
    priority?: RequestPriority;
    label?: string;
};

type Job = {
    priority: RequestPriority;
    run: () => Promise<boolean>;
    label: string;
    queuedAt: number;
};

const STALL_LOG_INTERVAL_MS = 5_000;

// Poor man's rate limiter that slows down requests so there is a `delayMs` gap between them.
export class RateLimiter {
    private readonly delayMs: number; // gap between each request
    private readonly timeoutMs: number;

    private readonly jobs: Job[] = [];
    private isDraining = false;
    private readonly name?: string;

    constructor(delayMs: number, timeoutMs: number, name?: string) {
        this.delayMs = delayMs;
        this.timeoutMs = timeoutMs;
        this.name = name;
    }

    private log(message: string) {
        if (this.name) {
            console.warn(`[${this.name} queue] ${message}`);
        }
    }

    limit<T>(
        fn: (signal?: AbortSignal) => Promise<T>,
        signal?: AbortSignal,
        { priority = 'normal', label = 'request' }: LimitOptions = {},
    ): Promise<T> {
        const queuedAt = Date.now();

        return new Promise<T>((resolve, reject) => {
            const run = async () => {
                if (signal?.aborted) {
                    this.log(`skipped (aborted while queued) ${label}`);
                    reject(signal.reason);

                    return false;
                }

                const startedAt = Date.now();
                this.log(
                    `start ${label} | waited ${startedAt - queuedAt}ms | ${this.jobs.length} still queued`,
                );
                const stallTimer = setInterval(() => {
                    this.log(
                        `STILL RUNNING ${label} | ${Date.now() - startedAt}ms | ${this.jobs.length} queued behind it`,
                    );
                }, STALL_LOG_INTERVAL_MS);

                try {
                    resolve(await scheduleAction(fn, { timeout: this.timeoutMs, signal }));
                    this.log(`done ${label} | ${Date.now() - startedAt}ms`);
                } catch (error) {
                    this.log(`FAILED ${label} | ${Date.now() - startedAt}ms | ${String(error)}`);
                    // ensure errors don't stop the queue
                    if (!signal?.aborted) console.error(error);
                    reject(error);
                } finally {
                    clearInterval(stallTimer);
                }

                return true;
            };

            this.log(`queued ${label} (${priority}) | ${this.jobs.length + 1} in queue`);
            this.enqueue({ priority, run, label, queuedAt });
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

    private logQueuedRequests() {
        const now = Date.now();
        const byLabel = new Map<string, { count: number; oldestQueuedAt: number }>();

        this.jobs.forEach(({ label, queuedAt }) => {
            const entry = byLabel.get(label);
            byLabel.set(label, {
                count: (entry?.count ?? 0) + 1,
                oldestQueuedAt: Math.min(entry?.oldestQueuedAt ?? queuedAt, queuedAt),
            });
        });

        const lines = [...byLabel.entries()].map(
            ([label, { count, oldestQueuedAt }]) =>
                `  ${count}x ${label} | oldest waiting ${now - oldestQueuedAt}ms`,
        );

        this.log(`${this.jobs.length} queued, ${byLabel.size} distinct URLs:\n${lines.join('\n')}`);
    }

    private async drain() {
        if (this.isDraining) return;

        this.isDraining = true;
        const snapshotTimer = setInterval(() => this.logQueuedRequests(), STALL_LOG_INTERVAL_MS);
        for (let job = this.jobs.shift(); job; job = this.jobs.shift()) {
            const hasRun = await job.run();
            if (hasRun) {
                await resolveAfter(this.delayMs);
            }
        }
        clearInterval(snapshotTimer);
        this.isDraining = false;
    }
}
