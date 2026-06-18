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

/**
 * Union of `[event, originating process]` tuples — each event is paired with the
 * exact process it came from, so the process type narrows alongside the event.
 */
export type MergedEventsWithProcess<Ps extends readonly RunnableProcess[]> = {
    [K in keyof Ps]: [ProcessEvent<Ps[K]>, Ps[K]];
}[number];

/** Tuple of every child process's result type, in the same order as the inputs. */
export type TupleResults<Ps extends readonly RunnableProcess[]> = {
    -readonly [K in keyof Ps]: ProcessResult<Ps[K]>;
};

/**
 * A master process that layers child processes onto each other.
 *
 * Build it up with `add()` (only before it starts — the tuple type accumulates
 * with each call, so results stay statically typed). `run()` runs all children
 * concurrently and yields their events as a single merged stream;
 * `runWithProcesses()` yields the same events paired with their originating
 * process. `cancel()` cancels every child and `toPromise()` resolves to a tuple
 * of their results, in order.
 */
export interface ProcessGroup<Ps extends readonly RunnableProcess[] = []> {
    /**
     * Layer another process onto the group, returning a NEW group whose type
     * carries the extended tuple. The original group is left untouched, so the
     * statically-known set of processes can never be mutated out from under a
     * consumer.
     */
    add<P extends RunnableProcess>(process: P): ProcessGroup<[...Ps, P]>;
    /** Merged stream of every child's events. */
    run(): AsyncIterableIterator<MergedEvents<Ps>>;
    /** Merged stream of `[event, originating process]` tuples. */
    runWithProcesses(): AsyncIterableIterator<MergedEventsWithProcess<Ps>>;
    cancel(): void;
    toPromise(): Promise<TupleResults<Ps>>;
    /** Number of child processes currently in the group. */
    readonly size: number;
}

const createGroup = (initial: readonly RunnableProcess[]): ProcessGroup<[]> => {
    const processes: readonly RunnableProcess[] = [...initial];
    let runCalled = false;

    // Runs every child concurrently, yielding [event, process] tuples. The
    // run-once guard lives here so both run() and runWithProcesses() share it.
    const startMerged = (): AsyncIterableIterator<[unknown, RunnableProcess]> => {
        if (runCalled) {
            throw new Error('ProcessGroup can only be run once.');
        }
        runCalled = true;

        const channel = new EventChannel<[unknown, RunnableProcess]>();
        const children = [...processes];
        let active = children.length;

        if (active === 0) {
            channel.close();
        }

        children.forEach(process => {
            void (async () => {
                try {
                    for await (const event of process.run()) {
                        channel.push([event, process]);
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
    };

    const group = {
        get size() {
            return processes.length;
        },

        add(process: RunnableProcess) {
            return createGroup([...processes, process]);
        },

        runWithProcesses(): AsyncIterableIterator<[unknown, RunnableProcess]> {
            return startMerged();
        },

        run(): AsyncIterableIterator<unknown> {
            const merged = startMerged();

            return (async function* () {
                for await (const [event] of merged) {
                    yield event;
                }
            })();
        },

        cancel() {
            processes.forEach(process => process.cancel());
        },

        toPromise(): Promise<unknown[]> {
            return Promise.all(processes.map(process => process.toPromise()));
        },
    };

    return group as unknown as ProcessGroup<[]>;
};

/**
 * Create a master process that layers child processes onto each other.
 *
 * - With a tuple of processes you get the fully-typed group straight away.
 * - With no argument you get an empty group to build up with `add()`, whose
 *   tuple type grows with each call.
 */
export function createProcessGroup<const Ps extends readonly RunnableProcess[]>(
    processes: Ps,
): ProcessGroup<Ps>;
export function createProcessGroup(): ProcessGroup<[]>;
export function createProcessGroup(processes: readonly RunnableProcess[] = []): unknown {
    return createGroup(processes);
}
