import { act, renderHook, waitFor } from '@testing-library/react';

import { createDeferred } from '@trezor/utils';

import { useAsyncMemo } from './useAsyncMemo';

describe('useAsyncMemo', () => {
    it('returns a synchronously computed value already during the first render', () => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        const { result } = renderHook(() => useAsyncMemo(() => 1, ['a']));

        expect(result.current).toBe(1);
    });

    it('returns a synchronously computed value immediately after the deps change', async () => {
        const { result, rerender } = renderHook(
            ({ key, value }: { key: string; value: number | Promise<number> }) =>
                // eslint-disable-next-line react-hooks/exhaustive-deps
                useAsyncMemo(() => value, [key]),
            { initialProps: { key: 'a', value: Promise.resolve(1) as number | Promise<number> } },
        );

        await waitFor(() => {
            expect(result.current).toBe(1);
        });

        // async -> sync
        // the new value replaces the stale resolution without an undefined frame
        rerender({ key: 'b', value: 2 });
        expect(result.current).toBe(2);

        // sync -> async
        // back to undefined until the promise resolves
        rerender({ key: 'c', value: Promise.resolve(3) });
        expect(result.current).toBeUndefined();

        await waitFor(() => {
            expect(result.current).toBe(3);
        });
    });

    it('returns undefined until the value resolves, then the value', async () => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        const { result } = renderHook(() => useAsyncMemo(() => Promise.resolve(1), ['a']));

        expect(result.current).toBeUndefined();

        await waitFor(() => {
            expect(result.current).toBe(1);
        });
    });

    it('returns undefined immediately after the deps change', async () => {
        const { result, rerender } = renderHook(
            // eslint-disable-next-line react-hooks/exhaustive-deps
            ({ key, value }) => useAsyncMemo(() => Promise.resolve(value), [key]),
            { initialProps: { key: 'a', value: 1 } },
        );

        await waitFor(() => {
            expect(result.current).toBe(1);
        });

        rerender({ key: 'b', value: 2 });

        expect(result.current).toBeUndefined();

        await waitFor(() => {
            expect(result.current).toBe(2);
        });
    });

    it('ignores a stale resolution that arrives after the deps changed', async () => {
        const deferredA = createDeferred<number>();
        const { result, rerender } = renderHook(
            // eslint-disable-next-line react-hooks/exhaustive-deps
            ({ key, promise }) => useAsyncMemo(() => promise, [key]),
            { initialProps: { key: 'a', promise: deferredA.promise } },
        );

        rerender({ key: 'b', promise: Promise.resolve(2) });

        await waitFor(() => {
            expect(result.current).toBe(2);
        });

        deferredA.resolve(1);
        await act(async () => {});

        expect(result.current).toBe(2);
    });

    it('keeps returning undefined when getValue rejects', async () => {
        const { result } = renderHook(() =>
            // eslint-disable-next-line react-hooks/exhaustive-deps
            useAsyncMemo(() => Promise.reject(new Error('failed')), ['a']),
        );

        await act(async () => {});

        expect(result.current).toBeUndefined();
    });

    it('uses the latest getValue closure when only the deps change', async () => {
        const { result, rerender } = renderHook(
            // eslint-disable-next-line react-hooks/exhaustive-deps
            ({ key, value }) => useAsyncMemo(() => Promise.resolve(value), [key]),
            { initialProps: { key: 'a', value: 1 } },
        );

        rerender({ key: 'b', value: 2 });

        await waitFor(() => {
            expect(result.current).toBe(2);
        });
    });
});
