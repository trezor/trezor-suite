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
    it('merges events from all layered processes', async () => {
        const group = createProcessGroup<TestEvent, string>();
        group.add(createFakeProcess('a', [1, 2], 'ra')).add(createFakeProcess('b', [3], 'rb'));

        expect(group.size).toBe(2);

        const seen: TestEvent[] = [];
        for await (const event of group.run()) {
            seen.push(event);
        }

        expect(seen).toHaveLength(3);
        expect(seen.filter(e => e.from === 'a').map(e => e.value)).toEqual([1, 2]);
        expect(seen.filter(e => e.from === 'b').map(e => e.value)).toEqual([3]);
    });

    it('throws when add() is called after the group has run', async () => {
        const group = createProcessGroup<TestEvent, string>();
        group.add(createFakeProcess('a', [1], 'ra'));

        // eslint-disable-next-line no-empty
        for await (const _ of group.run()) {
        }

        expect(() => group.add(createFakeProcess('b', [2], 'rb'))).toThrow(
            'Cannot add a process after the group has started.',
        );
    });

    it('throws when add() is called after toPromise()', async () => {
        const group = createProcessGroup<TestEvent, string>();
        group.add(createFakeProcess('a', [1], 'ra'));

        await group.toPromise();

        expect(() => group.add(createFakeProcess('b', [2], 'rb'))).toThrow();
    });

    it('run() can only be called once', async () => {
        const group = createProcessGroup<TestEvent, string>();
        group.add(createFakeProcess('a', [1], 'ra'));

        const iter = group.run();
        await iter.next();

        expect(() => group.run()).toThrow('ProcessGroup.run() can only be called once.');
    });

    it('toPromise() resolves with every child result', async () => {
        const group = createProcessGroup<TestEvent, string>();
        group.add(createFakeProcess('a', [1], 'ra')).add(createFakeProcess('b', [2], 'rb'));

        await expect(group.toPromise()).resolves.toEqual(['ra', 'rb']);
    });

    it('cancels remaining children when iteration breaks early', async () => {
        const group = createProcessGroup<TestEvent, string>();
        const a = createFakeProcess('a', [1, 2, 3], 'ra');
        const b = createFakeProcess('b', [4, 5, 6], 'rb');
        group.add(a).add(b);

        for await (const _event of group.run()) {
            break; // stop after the first event
        }

        expect(a.cancelled).toBe(true);
        expect(b.cancelled).toBe(true);
    });

    it('cancel() cancels all children', () => {
        const group = createProcessGroup<TestEvent, string>();
        const a = createFakeProcess('a', [1], 'ra');
        const b = createFakeProcess('b', [2], 'rb');
        group.add(a).add(b);

        group.cancel();

        expect(a.cancelled).toBe(true);
        expect(b.cancelled).toBe(true);
    });

    it('an empty group completes immediately', async () => {
        const group = createProcessGroup<TestEvent, string>();
        const seen: TestEvent[] = [];
        for await (const event of group.run()) {
            seen.push(event);
        }

        expect(seen).toEqual([]);
        await expect(group.toPromise()).resolves.toEqual([]);
    });

    it('typed constructor-list form infers a results tuple and merged event union', async () => {
        type EventA = { kind: 'a'; value: number };
        type EventB = { kind: 'b'; flag: boolean };

        const a: RunnableProcess<EventA, number> = {
            async *run() {
                yield { kind: 'a', value: 1 };
            },
            cancel() {},
            toPromise: () => Promise.resolve(42),
        };
        const b: RunnableProcess<EventB, string> = {
            async *run() {
                yield { kind: 'b', flag: true };
            },
            cancel() {},
            toPromise: () => Promise.resolve('done'),
        };

        const group = createProcessGroup([a, b]);

        const seen: (EventA | EventB)[] = [];
        for await (const event of group.run()) {
            // event is statically EventA | EventB — discriminating by `kind` is type-safe
            seen.push(event);
        }
        expect(seen.map(e => e.kind).sort()).toEqual(['a', 'b']);

        const results = await group.toPromise();
        // results is statically typed as [number, string]
        const [resultA, resultB] = results;
        expect(resultA).toBe(42);
        expect(resultB).toBe('done');

        // Compile-time assertions: tuple positions carry their own types.
        const _checkNumber: number = results[0];
        const _checkString: string = results[1];
        void _checkNumber;
        void _checkString;
    });
});
