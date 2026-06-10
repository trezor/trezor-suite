import { EventChannel } from './eventChannel';

/**
 * Minimal structural shape of anything runnable as a process: it can be run as
 * an async stream of events, cancelled, and awaited for a single result. The
 * `Process` returned by `createConnect` / `createConnectService` satisfies this.
 */
export interface RunnableProcess<TEvent = unknown, TResult = unknown> {
    run(): AsyncIterableIterator<TEvent>;
    cancel(): void;
    toPromise(): Promise<TResult>;
}

/**
 * A master process that layers child processes on top of each other. Children
 * are added with `add()`; `run()` runs them all concurrently and yields their
 * events as a single merged async stream. `cancel()` cancels every child and
 * `toPromise()` resolves once all children have completed.
 */
export interface ProcessGroup<TEvent = unknown, TResult = unknown> extends RunnableProcess<
    TEvent,
    TResult[]
> {
    /**
     * Layer another process onto the group. Returns the group for chaining.
     * Throws if the group has already been started (run or awaited).
     */
    add(process: RunnableProcess<TEvent, TResult>): ProcessGroup<TEvent, TResult>;
    /** Number of child processes currently in the group. */
    readonly size: number;
}

export const createProcessGroup = <TEvent = unknown, TResult = unknown>(): ProcessGroup<
    TEvent,
    TResult
> => {
    const processes: RunnableProcess<TEvent, TResult>[] = [];
    let started = false;
    let runCalled = false;

    const group: ProcessGroup<TEvent, TResult> = {
        get size() {
            return processes.length;
        },

        add(process) {
            if (started) {
                throw new Error('Cannot add a process after the group has started.');
            }
            processes.push(process);

            return group;
        },

        run(): AsyncIterableIterator<TEvent> {
            if (runCalled) {
                throw new Error('ProcessGroup.run() can only be called once.');
            }
            runCalled = true;
            started = true;

            const channel = new EventChannel<TEvent>();
            const children = [...processes];
            let active = children.length;

            if (active === 0) {
                channel.close();
            }

            // Pump every child concurrently into the shared channel. The channel
            // closes once the last child's stream ends.
            children.forEach(process => {
                void (async () => {
                    try {
                        for await (const event of process.run()) {
                            channel.push(event);
                        }
                    } finally {
                        active -= 1;
                        if (active === 0) {
                            channel.close();
                        }
                    }
                })();
            });

            async function* iterate() {
                let consumedAll = false;
                try {
                    while (true) {
                        const { value, done } = await channel.pull();
                        if (done) {
                            consumedAll = true;

                            return;
                        }
                        yield value;
                    }
                } finally {
                    // Consumer stopped early (break / throw) before the streams
                    // drained — cancel the still-running children.
                    if (!consumedAll) {
                        children.forEach(process => process.cancel());
                        channel.close();
                    }
                }
            }

            return iterate();
        },

        cancel() {
            processes.forEach(process => process.cancel());
        },

        toPromise() {
            started = true;

            return Promise.all(processes.map(process => process.toPromise()));
        },
    };

    return group;
};
