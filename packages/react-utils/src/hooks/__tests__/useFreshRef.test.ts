import { renderHook } from '@testing-library/react';

import { useFreshRef } from '../useFreshRef';

describe('useFreshRef', () => {
    it('sets ref.current to the latest value on the initial render', () => {
        const { result } = renderHook(() => useFreshRef('first'));

        expect(result.current.current).toBe('first');
    });

    it('updates ref.current synchronously when the value changes on rerender', () => {
        const { result, rerender } = renderHook(({ value }) => useFreshRef(value), {
            initialProps: { value: 0 },
        });

        expect(result.current.current).toBe(0);

        rerender({ value: 1 });

        expect(result.current.current).toBe(1);
    });

    it('returns the same ref object across rerenders', () => {
        const { result, rerender } = renderHook(({ value }) => useFreshRef(value), {
            initialProps: { value: 'a' },
        });

        const firstRef = result.current;

        rerender({ value: 'b' });

        expect(result.current).toBe(firstRef);
        expect(result.current.current).toBe('b');
    });
});
