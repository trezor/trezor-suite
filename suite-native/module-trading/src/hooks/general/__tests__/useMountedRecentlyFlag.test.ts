import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { RECENT_DURATION, useMountedRecentlyFlag } from '../useMountedRecentlyFlag';

jest.mock('../useMountedRecentlyFlag', () => jest.requireActual('../useMountedRecentlyFlag'));

describe('useMountedRecentlyFlag', () => {
    const renderUseMountedRecentlyFlag = () =>
        renderHookWithBasicProvider(() => useMountedRecentlyFlag());

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
});
