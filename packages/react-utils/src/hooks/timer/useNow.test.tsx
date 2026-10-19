import { act, renderHook } from '@testing-library/react';

import { useNow } from './useNow';

describe('useNow', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('returns the current time and refreshes it every interval', () => {
        const start = Date.now();
        const { result } = renderHook(() => useNow(60_000));

        expect(result.current).toBe(start);

        act(() => {
            jest.advanceTimersByTime(59_000);
        });
        expect(result.current).toBe(start);

        act(() => {
            jest.advanceTimersByTime(1_000);
        });
        expect(result.current).toBe(start + 60_000);
    });

    it('re-arms the interval when it changes', () => {
        const start = Date.now();
        const { result, rerender } = renderHook(({ intervalMs }) => useNow(intervalMs), {
            initialProps: { intervalMs: 60_000 },
        });

        rerender({ intervalMs: 1_000 });

        act(() => {
            jest.advanceTimersByTime(1_000);
        });
        expect(result.current).toBe(start + 1_000);
    });

    it('stops ticking after unmount', () => {
        const { result, unmount } = renderHook(() => useNow(1_000));
        const last = result.current;

        unmount();

        act(() => {
            jest.advanceTimersByTime(5_000);
        });
        expect(result.current).toBe(last);
    });
});
