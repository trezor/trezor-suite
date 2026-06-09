import { createCollection } from '../createCollection';

type Tx = { txid: string; title: string; amount: number };

const tx = (txid: string, title: string, amount = 0): Tx => ({ txid, title, amount });

describe('createCollection', () => {
    it('keys entities by id and dedupes shallow-equal re-adds', () => {
        const c = createCollection<Tx>({ getId: t => t.txid });

        c.add(tx('a', 'Alice'));
        const v1 = c.getVersion();

        // Same id, shallow-equal value (different reference) -> no-op.
        c.add(tx('a', 'Alice'));
        expect(c.getVersion()).toBe(v1);
        expect(c.size).toBe(1);

        // Same id, changed value -> bumps.
        c.add(tx('a', 'Alice', 5));
        expect(c.getVersion()).toBe(v1 + 1);
        expect(c.get('a')?.amount).toBe(5);
    });

    it('keeps the existing reference when an equal entity is re-added', () => {
        const c = createCollection<Tx>({ getId: t => t.txid });
        const original = tx('a', 'Alice');
        c.add(original);
        c.add(tx('a', 'Alice'));

        expect(c.get('a')).toBe(original);
    });

    it('emits at most one notification per addAll batch', () => {
        const c = createCollection<Tx>({ getId: t => t.txid });
        const listener = jest.fn();
        c.subscribe(listener);

        c.addAll([tx('a', 'A'), tx('b', 'B'), tx('c', 'C')]);
        expect(listener).toHaveBeenCalledTimes(1);

        // No real change -> no notification.
        c.addAll([tx('a', 'A'), tx('b', 'B')]);
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('returns a stable getAll snapshot until something changes', () => {
        const c = createCollection<Tx>({ getId: t => t.txid });
        c.addAll([tx('a', 'A'), tx('b', 'B')]);

        const first = c.getAll();
        expect(c.getAll()).toBe(first);

        c.add(tx('c', 'C'));
        expect(c.getAll()).not.toBe(first);
    });

    it('unsubscribes', () => {
        const c = createCollection<Tx>({ getId: t => t.txid });
        const listener = jest.fn();
        const unsubscribe = c.subscribe(listener);

        c.add(tx('a', 'A'));
        unsubscribe();
        c.add(tx('b', 'B'));

        expect(listener).toHaveBeenCalledTimes(1);
    });
});

describe('setAll', () => {
    it('reconciles by id: updates changed, removes absent, keeps unchanged refs', () => {
        const c = createCollection<Tx>({ getId: t => t.txid });
        const a = tx('a', 'Alice');
        const b = tx('b', 'Bob');
        c.addAll([a, b]);

        c.setAll([tx('a', 'Alice'), tx('c', 'Carol')]);

        expect(
            c
                .getAll()
                .map(t => t.txid)
                .sort(),
        ).toEqual(['a', 'c']);
        // 'a' unchanged -> same reference preserved.
        expect(c.get('a')).toBe(a);
        // 'b' removed.
        expect(c.has('b')).toBe(false);
    });

    it('adopts the order of the incoming items', () => {
        const c = createCollection<Tx>({ getId: t => t.txid });
        c.addAll([tx('a', 'A'), tx('b', 'B'), tx('c', 'C')]);

        c.setAll([tx('c', 'C'), tx('a', 'A'), tx('b', 'B')]);

        expect(c.getAll().map(t => t.txid)).toEqual(['c', 'a', 'b']);
    });

    it('notifies on a pure reordering', () => {
        const c = createCollection<Tx>({ getId: t => t.txid });
        c.addAll([tx('a', 'A'), tx('b', 'B')]);
        const listener = jest.fn();
        c.subscribe(listener);

        c.setAll([tx('b', 'B'), tx('a', 'A')]);
        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('does not notify when the incoming set is identical', () => {
        const c = createCollection<Tx>({ getId: t => t.txid });
        c.addAll([tx('a', 'A'), tx('b', 'B')]);
        const listener = jest.fn();
        c.subscribe(listener);

        c.setAll([tx('a', 'A'), tx('b', 'B')]);
        expect(listener).not.toHaveBeenCalled();
    });
});

describe('defineFilterQuery', () => {
    it('re-tests only the entities that changed on setAll', () => {
        const c = createCollection<Tx>({ getId: t => t.txid });
        c.addAll([tx('a', 'Alice'), tx('b', 'Bob'), tx('c', 'Alfred')]);

        const predicate = jest.fn((t: Tx, q: string) =>
            t.title.toLowerCase().includes(q.toLowerCase()),
        );
        const search = c.defineFilterQuery(predicate);

        // First run: predicate evaluated for all 3.
        const first = search('al');
        expect(first.map(t => t.txid)).toEqual(['a', 'c']);
        expect(predicate).toHaveBeenCalledTimes(3);

        predicate.mockClear();

        // Reset where only 'b' changes; 'a' and 'c' keep equal values.
        c.setAll([tx('a', 'Alice'), tx('b', 'Bobby'), tx('c', 'Alfred')]);
        const second = search('al');

        // Only the changed entity 'b' is re-tested.
        expect(predicate).toHaveBeenCalledTimes(1);
        expect(predicate).toHaveBeenCalledWith(expect.objectContaining({ txid: 'b' }), 'al');
        // 'b' still doesn't match -> membership unchanged -> same array reference.
        expect(second).toBe(first);
    });

    it('produces a new reference and includes a newly-matching entity', () => {
        const c = createCollection<Tx>({ getId: t => t.txid });
        c.addAll([tx('a', 'Alice'), tx('b', 'Bob')]);
        const search = c.defineFilterQuery((t: Tx, q: string) => t.title.includes(q));

        const first = search('Al');
        expect(first.map(t => t.txid)).toEqual(['a']);

        c.add(tx('b', 'Albert')); // 'b' now matches
        const second = search('Al');

        expect(second).not.toBe(first);
        expect(second.map(t => t.txid)).toEqual(['a', 'b']);
    });
});

describe('defineQuery', () => {
    const setup = () => {
        const c = createCollection<Tx>({ getId: t => t.txid });
        c.addAll([tx('a', 'Alice'), tx('b', 'Bob'), tx('c', 'Alfred')]);
        const byTitle = c.defineQuery((items, q: string) =>
            items.filter(t => t.title.toLowerCase().includes(q.toLowerCase())),
        );

        return { c, byTitle };
    };

    it('filters and memoizes by argument', () => {
        const { byTitle } = setup();

        const first = byTitle('al');
        expect(first.map(t => t.txid)).toEqual(['a', 'c']);
        // Same arg, same version -> identical reference.
        expect(byTitle('al')).toBe(first);
    });

    it('invalidates the cache when the collection changes', () => {
        const { c, byTitle } = setup();
        const first = byTitle('al');

        c.add(tx('d', 'Albert'));
        const second = byTitle('al');

        expect(second).not.toBe(first);
        expect(second.map(t => t.txid)).toEqual(['a', 'c', 'd']);
    });

    it('memoizes composite object args by value (shallowEqual)', () => {
        const c = createCollection<Tx>({ getId: t => t.txid });
        c.addAll([tx('a', 'Alice', 1), tx('b', 'Bob', 10)]);
        const search = c.defineQuery((items, filter: { q: string; minAmount: number }) =>
            items.filter(
                t =>
                    t.title.toLowerCase().includes(filter.q.toLowerCase()) &&
                    t.amount >= filter.minAmount,
            ),
        );

        const first = search({ q: '', minAmount: 5 });
        // Freshly-created arg object with identical fields -> same reference.
        expect(search({ q: '', minAmount: 5 })).toBe(first);
        expect(first.map(t => t.txid)).toEqual(['b']);

        // Different arg value -> recomputes.
        expect(search({ q: '', minAmount: 0 })).not.toBe(first);
    });

    it('evicts beyond the configured cache size', () => {
        const c = createCollection<Tx>({ getId: t => t.txid });
        c.addAll([tx('a', 'A')]);
        const spy = jest.fn((items: readonly Tx[], q: string) => items.filter(t => t.title === q));
        const q = c.defineQuery(spy, { cacheSize: 2 });

        const a1 = q('A');
        q('B');
        q('C'); // evicts 'A'
        const callsBefore = spy.mock.calls.length;
        const a2 = q('A'); // recomputed -> new reference, extra call

        expect(a2).not.toBe(a1);
        expect(spy.mock.calls.length).toBe(callsBefore + 1);
    });
});
