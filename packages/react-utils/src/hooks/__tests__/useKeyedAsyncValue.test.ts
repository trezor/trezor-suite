import { act, renderHook, waitFor } from '@testing-library/react';

import { createDeferred } from '@trezor/utils';

import { useKeyedAsyncValue } from '../useKeyedAsyncValue';

describe('useKeyedAsyncValue', () => {
    it('returns undefined until the value resolves, then the value', async () => {
        const { result } = renderHook(() => useKeyedAsyncValue('a', () => Promise.resolve(1)));

        expect(result.current).toBeUndefined();

        await waitFor(() => {
            expect(result.current).toBe(1);
        });
    });

    it('returns undefined immediately after the key changes', async () => {
        const { result, rerender } = renderHook(
            ({ key, value }) => useKeyedAsyncValue(key, () => Promise.resolve(value)),
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

    it('ignores a stale resolution that arrives after the key changed', async () => {
        const deferredA = createDeferred<number>();
        const { result, rerender } = renderHook(
            ({ key, promise }) => useKeyedAsyncValue(key, () => promise),
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
            useKeyedAsyncValue('a', () => Promise.reject(new Error('failed'))),
        );

        await act(async () => {});

        expect(result.current).toBeUndefined();
    });

    it('uses the latest getValue closure when only the key changes', async () => {
        const { result, rerender } = renderHook(
            ({ key, value }) => useKeyedAsyncValue(key, () => Promise.resolve(value)),
            { initialProps: { key: 'a', value: 1 } },
        );

        rerender({ key: 'b', value: 2 });

        await waitFor(() => {
            expect(result.current).toBe(2);
        });
    });
});
