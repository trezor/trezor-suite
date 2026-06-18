import { type RunnableProcess, createProcessGroup } from '../processGroup';

type TestEvent = { from: string; value: number };

// Minimal controllable process: emits the given events (each after an awaited
// microtask so concurrency interleaves), then completes with `result`.
const createFakeProcess = (
    from: string,
    values: number[],
    result: string,
): RunnableProcess<TestEvent, string> & { cancelled: boolean } => {
    const state = { cancelled: false };

    return {
        get cancelled() {
            return state.cancelled;
        },
        async *run() {
            for (const value of values) {
                if (state.cancelled) return;
                await Promise.resolve();
                yield { from, value };
            }
        },
        cancel() {
            state.cancelled = true;
        },
        toPromise() {
            return Promise.resolve(result);
        },
    };
};

describe('createProcessGroup', () => {
    it('run() merges events from all layered processes', async () => {
        const group = createProcessGroup()
            .add(createFakeProcess('a', [1, 2], 'ra'))
            .add(createFakeProcess('b', [3], 'rb'));

        expect(group.size).toBe(2);

        const seen: TestEvent[] = [];
        for await (const event of group.run()) {
            seen.push(event);
        }

        expect(seen).toHaveLength(3);
        expect(seen.filter(e => e.from === 'a').map(e => e.value)).toEqual([1, 2]);
        expect(seen.filter(e => e.from === 'b').map(e => e.value)).toEqual([3]);
    });

    it('add() is immutable — it returns a new group and leaves the original untouched', () => {
        const empty = createProcessGroup();
        const one = empty.add(createFakeProcess('a', [1], 'ra'));
        const two = one.add(createFakeProcess('b', [2], 'rb'));

        expect(empty.size).toBe(0);
        expect(one.size).toBe(1);
        expect(two.size).toBe(2);
    });

    it('runWithProcesses() yields type-safe [event, originating process] tuples', async () => {
        type EventA = { kind: 'a'; n: number };
        type EventB = { kind: 'b'; s: string };

        const a: RunnableProcess<EventA, number> = {
            async *run() {
                yield { kind: 'a', n: 7 };
            },
            cancel() {},
            toPromise: () => Promise.resolve(42),
        };
        const b: RunnableProcess<EventB, string> = {
            async *run() {
                yield { kind: 'b', s: 'hi' };
            },
            cancel() {},
            toPromise: () => Promise.resolve('done'),
        };

        const group = createProcessGroup([a, b]);

        const seenNumbers: number[] = [];
        const seenStrings: string[] = [];
        for await (const pair of group.runWithProcesses()) {
            // `pair` is the discriminated union [EventA, typeof a] | [EventB, typeof b].
            // Narrowing on the event's discriminant narrows the process too.
            if (pair[0].kind === 'a') {
                const event = pair[0]; // EventA
                const process = pair[1]; // typeof a -> RunnableProcess<EventA, number>
                seenNumbers.push(event.n);
                await expect(process.toPromise()).resolves.toBe(42);
            } else {
                const event = pair[0]; // EventB
                const process = pair[1]; // typeof b -> RunnableProcess<EventB, string>
                seenStrings.push(event.s);
                await expect(process.toPromise()).resolves.toBe('done');
            }
        }

        expect(seenNumbers).toEqual([7]);
        expect(seenStrings).toEqual(['hi']);
    });

    it('add() accumulates a statically-typed result tuple', async () => {
        const a: RunnableProcess<TestEvent, number> = {
            async *run() {
                yield { from: 'a', value: 1 };
            },
            cancel() {},
            toPromise: () => Promise.resolve(42),
        };
        const b: RunnableProcess<TestEvent, string> = {
            async *run() {
                yield { from: 'b', value: 2 };
            },
            cancel() {},
            toPromise: () => Promise.resolve('done'),
        };

        const group = createProcessGroup().add(a).add(b);

        const results = await group.toPromise();
        const [resultA, resultB] = results;
        expect(resultA).toBe(42);
        expect(resultB).toBe('done');

        // Compile-time assertions: tuple positions carry their own types.
        const _checkNumber: number = results[0];
        const _checkString: string = results[1];
        void _checkNumber;
        void _checkString;
    });

    it('can only be run once (run / runWithProcesses share the guard)', async () => {
        const group = createProcessGroup().add(createFakeProcess('a', [1], 'ra'));

        const iter = group.run();
        await iter.next();

        expect(() => group.run()).toThrow('ProcessGroup can only be run once.');
        expect(() => group.runWithProcesses()).toThrow('ProcessGroup can only be run once.');
    });

    it('toPromise() resolves with every child result', async () => {
        const group = createProcessGroup()
            .add(createFakeProcess('a', [1], 'ra'))
            .add(createFakeProcess('b', [2], 'rb'));

        await expect(group.toPromise()).resolves.toEqual(['ra', 'rb']);
    });

    it('cancels remaining children when iteration breaks early', async () => {
        const a = createFakeProcess('a', [1, 2, 3], 'ra');
        const b = createFakeProcess('b', [4, 5, 6], 'rb');
        const group = createProcessGroup([a, b]);

        for await (const _event of group.run()) {
            break; // stop after the first event
        }

        expect(a.cancelled).toBe(true);
        expect(b.cancelled).toBe(true);
    });

    it('cancel() cancels all children', () => {
        const a = createFakeProcess('a', [1], 'ra');
        const b = createFakeProcess('b', [2], 'rb');
        const group = createProcessGroup([a, b]);

        group.cancel();

        expect(a.cancelled).toBe(true);
        expect(b.cancelled).toBe(true);
    });

    it('an empty group completes immediately', async () => {
        const group = createProcessGroup();
        const seen: unknown[] = [];
        for await (const event of group.run()) {
            seen.push(event);
        }

        expect(seen).toEqual([]);
        await expect(group.toPromise()).resolves.toEqual([]);
    });
});
