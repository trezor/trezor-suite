import { act, renderHook } from '@testing-library/react';

import { useIsPastDeadline } from './useIsPastDeadline';

describe('useIsPastDeadline', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('flips to true when the lead before the deadline is reached', () => {
        const deadline = Date.now() + 10_000;
        const { result } = renderHook(() => useIsPastDeadline(deadline));

        expect(result.current).toBe(false);

        act(() => {
            jest.advanceTimersByTime(8_999);
        });
        expect(result.current).toBe(false);

        act(() => {
            jest.advanceTimersByTime(1);
        });
        expect(result.current).toBe(true);
    });

    it('is true right away for a deadline in the past', () => {
        const { result } = renderHook(() => useIsPastDeadline(Date.now() - 1));

        expect(result.current).toBe(true);
    });

    it('stays false without a deadline', () => {
        const { result } = renderHook(() => useIsPastDeadline(undefined));

        act(() => {
            jest.advanceTimersByTime(60_000);
        });
        expect(result.current).toBe(false);
    });

    it('resets when the deadline moves', () => {
        const { result, rerender } = renderHook(
            ({ deadline }) => useIsPastDeadline(deadline, { pastDeadlineLeadMs: 0 }),
            { initialProps: { deadline: Date.now() + 1_000 } },
        );

        act(() => {
            jest.advanceTimersByTime(1_000);
        });
        expect(result.current).toBe(true);

        rerender({ deadline: Date.now() + 5_000 });
        expect(result.current).toBe(false);

        act(() => {
            jest.advanceTimersByTime(5_000);
        });
        expect(result.current).toBe(true);
    });

    it('waits for a deadline beyond the maximum timeout delay', () => {
        const deadline = Date.now() + 2 ** 31 + 10_000;
        const { result } = renderHook(() => useIsPastDeadline(deadline, { pastDeadlineLeadMs: 0 }));

        act(() => {
            jest.advanceTimersByTime(2 ** 31);
        });
        expect(result.current).toBe(false);

        act(() => {
            jest.advanceTimersByTime(10_000);
        });
        expect(result.current).toBe(true);
    });
});
