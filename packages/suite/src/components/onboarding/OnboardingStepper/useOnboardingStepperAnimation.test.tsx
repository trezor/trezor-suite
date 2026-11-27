import { act, renderHook } from '@testing-library/react';

import { STEPPER_FILL_MS, STEPPER_RESIZE_MS } from './animationTimings';
import { type OnboardingProgress } from './getOnboardingProgress';
import { useOnboardingStepperAnimation } from './useOnboardingStepperAnimation';

const firmware: OnboardingProgress = { device: 2 / 5, wallet: 0, pin: 0 };
const authenticity: OnboardingProgress = { device: 3 / 5, wallet: 0, pin: 0 };
const walletChoice: OnboardingProgress = { device: 1, wallet: 1 / 3, pin: 0 };
const backup: OnboardingProgress = { device: 1, wallet: 2 / 3, pin: 0 };
const final: OnboardingProgress = { device: 1, wallet: 1, pin: 1 };

type AnimationProps = {
    progress: OnboardingProgress | undefined;
    shouldReduceMotion: boolean;
};

const initialProps: AnimationProps = {
    progress: firmware,
    shouldReduceMotion: false,
};

describe(useOnboardingStepperAnimation.name, () => {
    beforeEach(() => {
        jest.useFakeTimers({ legacyFakeTimers: false });
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    it('holds the last progress while device information is unavailable', () => {
        const { result, rerender } = renderHook(useOnboardingStepperAnimation, { initialProps });

        rerender({ ...initialProps, progress: undefined });
        act(() => jest.advanceTimersByTime(STEPPER_FILL_MS + STEPPER_RESIZE_MS));

        expect(result.current.progress).toEqual(firmware);
        expect(result.current.activeCategory).toBe('device');

        rerender({ ...initialProps, progress: authenticity });
        expect(result.current.progress).toEqual(authenticity);
    });

    it('finishes the old fill before changing bullets, then lets the new line grow before filling', () => {
        const { result, rerender } = renderHook(useOnboardingStepperAnimation, { initialProps });

        rerender({ ...initialProps, progress: walletChoice });
        expect(result.current.activeCategory).toBe('device');
        expect(result.current.progress).toEqual({ device: 1, wallet: 0, pin: 0 });

        act(() => jest.advanceTimersByTime(STEPPER_FILL_MS - 1));
        expect(result.current.activeCategory).toBe('device');

        act(() => jest.advanceTimersByTime(1));
        expect(result.current.activeCategory).toBe('wallet');
        expect(result.current.progress).toEqual(walletChoice);
        expect(result.current.fillDelayMs).toBe(STEPPER_RESIZE_MS);
    });

    it('updates a sub-step without waiting for a category transition', () => {
        const { result, rerender } = renderHook(useOnboardingStepperAnimation, { initialProps });

        rerender({ ...initialProps, progress: authenticity });

        expect(result.current.progress).toEqual(authenticity);
        expect(result.current.fillDelayMs).toBe(0);
    });

    it('keeps the original completion deadline when the next screen changes again', () => {
        const { result, rerender } = renderHook(useOnboardingStepperAnimation, { initialProps });

        rerender({ ...initialProps, progress: walletChoice });
        act(() => jest.advanceTimersByTime(100));
        rerender({ ...initialProps, progress: backup });
        act(() => jest.advanceTimersByTime(STEPPER_FILL_MS - 100));

        expect(result.current.progress).toEqual(backup);
        expect(result.current.activeCategory).toBe('wallet');
    });

    it('returns to an earlier category without leaving a stale completion callback', () => {
        const { result, rerender } = renderHook(useOnboardingStepperAnimation, { initialProps });

        rerender({ ...initialProps, progress: walletChoice });
        act(() => jest.advanceTimersByTime(100));
        rerender({ ...initialProps, progress: authenticity });
        act(() => jest.advanceTimersByTime(STEPPER_FILL_MS));

        expect(result.current.progress).toEqual(authenticity);
        expect(result.current.activeCategory).toBe('device');
    });

    it('skips animation delays for reduced motion and cancels timers on unmount', () => {
        const { result, rerender, unmount } = renderHook(useOnboardingStepperAnimation, {
            initialProps,
        });

        rerender({ ...initialProps, progress: walletChoice, shouldReduceMotion: true });
        expect(result.current.progress).toEqual(walletChoice);
        expect(result.current.fillDelayMs).toBe(0);

        rerender({ ...initialProps, progress: final });
        unmount();
        expect(jest.getTimerCount()).toBe(0);
    });
});
