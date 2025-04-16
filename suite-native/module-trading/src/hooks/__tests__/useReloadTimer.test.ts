import { INVITY_API_RELOAD_QUOTES_AFTER_SECONDS } from '@suite-common/trading';
import { renderHook } from '@suite-native/test-utils';
import { useTimer } from '@trezor/react-utils';

import { MAX_RESET_COUNT, useReloadTimer } from '../useReloadTimer';

let mockTimerReturn: ReturnType<typeof useTimer>;

jest.mock('@trezor/react-utils', () => ({
    ...jest.requireActual('@trezor/react-utils'),
    useTimer: () => mockTimerReturn,
}));

describe('useReloadTimer', () => {
    const renderUseReloadTimer = (initialEnabled: boolean = true) =>
        renderHook(({ isEnabled }) => useReloadTimer(isEnabled), {
            initialProps: { isEnabled: initialEnabled },
        });

    beforeEach(() => {
        mockTimerReturn = {
            timeSpent: { seconds: 0 },
            resetCount: 0,
            isStopped: false,
            isLoading: false,
            stop: jest.fn(),
            reset: jest.fn(),
            loading: jest.fn(),
        };
    });

    it('should return running timer and shouldReload equal false', () => {
        const { result } = renderUseReloadTimer();

        expect(result.current.shouldReload).toBe(false);
        expect(result.current.timer.stop).not.toHaveBeenCalled();
    });

    it('should stop timer when reset count is equal to 40', () => {
        mockTimerReturn.resetCount = MAX_RESET_COUNT;

        const { result } = renderUseReloadTimer();

        expect(result.current.timer.stop).toHaveBeenCalled();
    });

    it('should stop timer when reset count is greater than 40', () => {
        mockTimerReturn.resetCount = MAX_RESET_COUNT + 1;

        const { result } = renderUseReloadTimer();

        expect(result.current.timer.stop).toHaveBeenCalled();
    });

    it('should set shouldReload to true when time spent is equal to INVITY_API_RELOAD_QUOTES_AFTER_SECONDS', () => {
        mockTimerReturn.timeSpent.seconds = INVITY_API_RELOAD_QUOTES_AFTER_SECONDS;

        const { result } = renderUseReloadTimer();

        expect(result.current.shouldReload).toBe(true);
    });

    it('should set shouldReload to true when time spent is greater than INVITY_API_RELOAD_QUOTES_AFTER_SECONDS', () => {
        mockTimerReturn.timeSpent.seconds = INVITY_API_RELOAD_QUOTES_AFTER_SECONDS + 1;

        const { result } = renderUseReloadTimer();

        expect(result.current.shouldReload).toBe(true);
    });

    it('should not call stop when isStopped is true', () => {
        mockTimerReturn.timeSpent.seconds = INVITY_API_RELOAD_QUOTES_AFTER_SECONDS + 1;
        mockTimerReturn.isStopped = true;

        const { result } = renderUseReloadTimer();

        expect(result.current.shouldReload).toBe(false);
        expect(result.current.timer.stop).not.toHaveBeenCalled();
    });

    it('should not call stop when isLoading is true', () => {
        mockTimerReturn.timeSpent.seconds = INVITY_API_RELOAD_QUOTES_AFTER_SECONDS + 1;
        mockTimerReturn.isLoading = true;

        const { result } = renderUseReloadTimer();

        expect(result.current.shouldReload).toBe(false);
        expect(result.current.timer.stop).not.toHaveBeenCalled();
    });

    it('should stop timer when isEnabled is false', () => {
        const { result } = renderUseReloadTimer(false);

        expect(result.current.timer.stop).toHaveBeenCalled();
        expect(result.current.shouldReload).toBe(false);
    });

    it('should return shouldReload when timer is not enabled even when reload time is reached', () => {
        mockTimerReturn.timeSpent.seconds = INVITY_API_RELOAD_QUOTES_AFTER_SECONDS + 1;
        const { result } = renderUseReloadTimer(false);

        expect(result.current.timer.stop).toHaveBeenCalled();
        expect(result.current.shouldReload).toBe(false);
    });

    it('should reset timer when enabled but stopped', () => {
        mockTimerReturn.isStopped = true;
        const { result } = renderUseReloadTimer();

        expect(result.current.timer.reset).toHaveBeenCalled();
    });

    it('should not reset timer when isStopped and isLoading', () => {
        mockTimerReturn.isStopped = true;
        mockTimerReturn.isLoading = true;
        const { result } = renderUseReloadTimer();

        expect(result.current.timer.reset).not.toHaveBeenCalled();
    });

    it('should not reset timer when stopped and MAX_RESET_COUNT is reached', () => {
        mockTimerReturn.isStopped = true;
        mockTimerReturn.resetCount = MAX_RESET_COUNT + 1;
        const { result } = renderUseReloadTimer();

        expect(result.current.timer.reset).not.toHaveBeenCalled();
    });
});
