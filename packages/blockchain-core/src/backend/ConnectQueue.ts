export type ConnectLane = 'default' | 'identity';

/**
 * Lets at most `limit` tasks run at once.
 * A freed slot goes to the oldest waiting task of the default lane,
 * and to the identity lane only when no default task is waiting.
 */
export class ConnectQueue {
    private running = 0;
    private readonly waiting: Record<ConnectLane, Array<() => void>> = {
        default: [],
        identity: [],
    };

    constructor(private readonly limit: number) {}

    run<T>(lane: ConnectLane, task: () => Promise<T>): Promise<T> {
        return this.acquire(lane)
            .then(task)
            .finally(() => this.release());
    }

    private acquire(lane: ConnectLane): Promise<void> {
        if (this.running < this.limit) {
            this.running += 1;

            return Promise.resolve();
        }

        return new Promise(resolve => this.waiting[lane].push(resolve));
    }

    private release() {
        const next = this.waiting.default.shift() ?? this.waiting.identity.shift();
        // The slot passes straight to the next task, so the count stays.
        if (next) next();
        else this.running -= 1;
    }
}
