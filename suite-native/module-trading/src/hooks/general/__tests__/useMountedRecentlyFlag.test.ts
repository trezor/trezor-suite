import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { RECENT_DURATION, useMountedRecentlyFlag } from '../useMountedRecentlyFlag';

jest.mock('../useMountedRecentlyFlag', () => jest.requireActual('../useMountedRecentlyFlag'));

describe('useMountedRecentlyFlag', () => {
    const renderUseMountedRecentlyFlag = () =>
        renderHookWithBasicProvider(({ context }) => useMountedRecentlyFlag(context), {
            initialProps: { context: 'context_1' },
        });

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should be true by default', () => {
        const { result } = renderUseMountedRecentlyFlag();

        expect(result.current).toEqual(true);
    });

    it('should be false after RECENT_DURATION time', () => {
        const { result } = renderUseMountedRecentlyFlag();

        act(() => {
            jest.advanceTimersByTime(RECENT_DURATION);
        });

        expect(result.current).toEqual(false);
    });

    it('should reset to true when context changes', () => {
        const { result, rerender } = renderUseMountedRecentlyFlag();
        act(() => {
            jest.advanceTimersByTime(RECENT_DURATION);
        });

        rerender({ context: 'context_2' });

        expect(result.current).toEqual(true);
    });

    it('should re-run timer on context change', () => {
        const { result, rerender } = renderUseMountedRecentlyFlag();
        act(() => {
            jest.advanceTimersByTime(RECENT_DURATION);
        });
        rerender({ context: 'context_2' });

        act(() => {
            jest.advanceTimersByTime(RECENT_DURATION);
        });

        expect(result.current).toEqual(false);
    });
});
