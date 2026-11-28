import { withTiming } from 'react-native-reanimated';

import { act, renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useAlertAnimation } from './useAlertAnimation';

jest.mock('react-native-reanimated', () => ({
    ...jest.requireActual('react-native-reanimated/mock'),
    useReducedMotion: jest.fn(() => false),
    withTiming: jest.fn(jest.requireActual('react-native-reanimated/mock').withTiming),
}));

describe('useAlertAnimation', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    it('restores opacity when a replacement sheet opens during a close animation', async () => {
        jest.useFakeTimers();
        const timing = jest.mocked(withTiming);
        const { result, unmount } = await renderHookWithBasicProvider(() => useAlertAnimation({}));
        await act(() => {
            void result.current.closeSheetAnimated();
        });
        timing.mockClear();

        await act(() => result.current.openSheetAnimated());
        await act(() => jest.advanceTimersByTime(300));
        await unmount();
        jest.useRealTimers();

        expect(timing).toHaveBeenCalledWith(1, expect.objectContaining({ duration: 300 }));
        expect(timing).toHaveBeenCalledWith(0, expect.objectContaining({ duration: 300 }));
    });
});
