import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { RECENT_DURATION, useMountedRecentlyFlag } from './useMountedRecentlyFlag';

jest.mock('./useMountedRecentlyFlag', () => jest.requireActual('./useMountedRecentlyFlag'));

describe('useMountedRecentlyFlag', () => {
    const renderUseMountedRecentlyFlag = async () =>
        await renderHookWithBasicProvider(({ context }) => useMountedRecentlyFlag(context), {
            initialProps: { context: 'context_1' },
        });

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(async () => {
        await act(() => {
            jest.runOnlyPendingTimers();
        });
        jest.useRealTimers();
    });

    it('should be true by default', async () => {
        const { result } = await renderUseMountedRecentlyFlag();

        expect(result.current).toEqual(true);
    });

    it('should be false after RECENT_DURATION time', async () => {
        const { result } = await renderUseMountedRecentlyFlag();

        await act(() => {
            jest.advanceTimersByTime(RECENT_DURATION);
        });

        expect(result.current).toEqual(false);
    });

    it('should reset to true when context changes', async () => {
        const { result, rerender } = await renderUseMountedRecentlyFlag();
        await act(() => {
            jest.advanceTimersByTime(RECENT_DURATION);
        });

        await rerender({ context: 'context_2' });

        expect(result.current).toEqual(true);
    });

    it('should re-run timer on context change', async () => {
        const { result, rerender } = await renderUseMountedRecentlyFlag();
        await act(() => {
            jest.advanceTimersByTime(RECENT_DURATION);
        });
        await rerender({ context: 'context_2' });

        await act(() => {
            jest.advanceTimersByTime(RECENT_DURATION);
        });

        expect(result.current).toEqual(false);
    });
});
