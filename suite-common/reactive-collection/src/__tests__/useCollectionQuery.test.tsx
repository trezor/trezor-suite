/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';

import { createCollection } from '../createCollection';
import { useCollectionQuery } from '../useCollectionQuery';

type Tx = { txid: string; title: string };

const tx = (txid: string, title: string): Tx => ({ txid, title });

describe('useCollectionQuery', () => {
    it('returns query results and re-renders only on relevant changes', () => {
        const c = createCollection<Tx>({ getId: t => t.txid });
        c.addAll([tx('a', 'Alice'), tx('b', 'Bob')]);
        const byTitle = c.defineQuery((items, q: string) => items.filter(t => t.title.includes(q)));

        let renders = 0;
        const { result } = renderHook(() => {
            renders += 1;

            return useCollectionQuery(c, byTitle, 'Al');
        });

        expect(result.current.map(t => t.txid)).toEqual(['a']);
        const rendersAfterMount = renders;

        // Change that does NOT affect the 'Al' query result -> no re-render.
        act(() => {
            c.add(tx('c', 'Bobby'));
        });
        expect(renders).toBe(rendersAfterMount);

        // Change that DOES affect it -> one re-render with new result.
        act(() => {
            c.add(tx('d', 'Alfred'));
        });
        expect(result.current.map(t => t.txid)).toEqual(['a', 'd']);
        expect(renders).toBe(rendersAfterMount + 1);
    });

    it('debounces argument changes', () => {
        jest.useFakeTimers();
        try {
            const c = createCollection<Tx>({ getId: t => t.txid });
            c.addAll([tx('a', 'Alice'), tx('b', 'Bob')]);
            const byTitle = c.defineFilterQuery((t, q: string) => t.title.includes(q));

            const { result, rerender } = renderHook(
                ({ q }: { q: string }) => useCollectionQuery(c, byTitle, q, { debounceMs: 300 }),
                { initialProps: { q: 'A' } },
            );

            // First value applies immediately.
            expect(result.current.map(t => t.txid)).toEqual(['a']);

            // Change the arg — result should NOT update until the debounce elapses.
            rerender({ q: 'Bo' });
            expect(result.current.map(t => t.txid)).toEqual(['a']);

            act(() => {
                jest.advanceTimersByTime(299);
            });
            expect(result.current.map(t => t.txid)).toEqual(['a']);

            act(() => {
                jest.advanceTimersByTime(1);
            });
            expect(result.current.map(t => t.txid)).toEqual(['b']);
        } finally {
            jest.useRealTimers();
        }
    });
});
