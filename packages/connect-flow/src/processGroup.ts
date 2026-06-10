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

type ProcessEvent<P> = P extends RunnableProcess<infer TEvent, any> ? TEvent : never;
type ProcessResult<P> = P extends RunnableProcess<any, infer TResult> ? TResult : never;

/** Union of every child process's event type. */
export type MergedEvents<Ps extends readonly RunnableProcess[]> = ProcessEvent<Ps[number]>;

/** Tuple of every child process's result type, in the same order as the inputs. */
export type TupleResults<Ps extends readonly RunnableProcess[]> = {
    -readonly [K in keyof Ps]: ProcessResult<Ps[K]>;
};

/**
 * A dynamically-built master process: child processes are layered on with
 * `add()`, `run()` runs them all concurrently and yields their events as a
 * single merged async stream, `cancel()` cancels every child, and `toPromise()`
 * resolves once all children have completed.
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

/**
 * A statically-typed master process built from a fixed tuple of processes: the
 * merged event stream is the union of the children's events and `toPromise()`
 * resolves to a tuple of their results, in input order. The set is fixed at
 * creation, so there is no `add()`.
 */
export interface TypedProcessGroup<Ps extends readonly RunnableProcess[]> {
    run(): AsyncIterableIterator<MergedEvents<Ps>>;
    cancel(): void;
    toPromise(): Promise<TupleResults<Ps>>;
    readonly size: number;
}

const createGroup = (initial: readonly RunnableProcess[]) => {
    const processes: RunnableProcess[] = [...initial];
    let started = false;
    let runCalled = false;

    const group = {
        get size() {
            return processes.length;
        },

        add(process: RunnableProcess) {
            if (started) {
                throw new Error('Cannot add a process after the group has started.');
            }
            processes.push(process);

            return group;
        },

        run(): AsyncIterableIterator<unknown> {
            if (runCalled) {
                throw new Error('ProcessGroup.run() can only be called once.');
            }
            runCalled = true;
            started = true;

            const channel = new EventChannel<unknown>();
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

/**
 * Create a master process that layers child processes onto each other.
 *
 * - Passing a tuple of processes returns a {@link TypedProcessGroup}: events are
 *   the union of the children's event types and `toPromise()` resolves to a
 *   tuple of their results, in order.
 * - Calling with no argument returns a dynamic {@link ProcessGroup} you build up
 *   with `add()`.
 */
export function createProcessGroup<const Ps extends readonly RunnableProcess[]>(
    processes: Ps,
): TypedProcessGroup<Ps>;
export function createProcessGroup<TEvent = unknown, TResult = unknown>(): ProcessGroup<
    TEvent,
    TResult
>;
export function createProcessGroup(processes: readonly RunnableProcess[] = []): unknown {
    return createGroup(processes);
}
