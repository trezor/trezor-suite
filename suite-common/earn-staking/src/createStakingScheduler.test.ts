import { mock } from '@trezor/dependency-injection';

import {
    STAKING_PRODUCT_INFO_REFRESH_INTERVAL_MS,
    type StakingSchedulerDeps,
    type SubscribeToForeground,
    createStakingScheduler,
} from './createStakingScheduler';

const NOW = 1_800_000_000_000;
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

type SchedulerHarness = {
    deps: StakingSchedulerDeps;
    foreground: () => void;
    unsubscribe: jest.Mock;
};

const createHarness = (): SchedulerHarness => {
    let listener: (() => void) | null = null;
    const unsubscribe = jest.fn();
    const subscribeToForeground = mock<SubscribeToForeground>(nextListener => {
        listener = nextListener;

        return unsubscribe;
    });

    return {
        deps: {
            refresh: mock<StakingSchedulerDeps['refresh']>(() => {}),
            revalidate: mock<StakingSchedulerDeps['revalidate']>(() => {}),
            subscribeToForeground,
        },
        foreground: () => listener?.(),
        unsubscribe,
    };
};

describe('createStakingScheduler', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(NOW);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('refreshes the product info every minute once started', () => {
        const { deps } = createHarness();
        const scheduler = createStakingScheduler(deps);

        scheduler.start();
        expect(deps.refresh).not.toHaveBeenCalled();

        jest.advanceTimersByTime(STAKING_PRODUCT_INFO_REFRESH_INTERVAL_MS);
        expect(deps.refresh).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(2 * STAKING_PRODUCT_INFO_REFRESH_INTERVAL_MS);
        expect(deps.refresh).toHaveBeenCalledTimes(3);
    });

    it('does nothing before start and stops ticking after stop', () => {
        const { deps, unsubscribe } = createHarness();
        const scheduler = createStakingScheduler(deps);

        scheduler.scheduleRevalidation(NOW + MINUTE_MS);
        jest.advanceTimersByTime(DAY_MS);
        expect(deps.refresh).not.toHaveBeenCalled();
        expect(deps.revalidate).not.toHaveBeenCalled();

        scheduler.start();
        scheduler.stop();
        jest.advanceTimersByTime(DAY_MS);

        expect(deps.refresh).not.toHaveBeenCalled();
        expect(deps.revalidate).not.toHaveBeenCalled();
        expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('starts once however often it is asked', () => {
        const { deps } = createHarness();
        const scheduler = createStakingScheduler(deps);

        scheduler.start();
        scheduler.start();
        jest.advanceTimersByTime(STAKING_PRODUCT_INFO_REFRESH_INTERVAL_MS);

        expect(deps.refresh).toHaveBeenCalledTimes(1);
        expect(deps.subscribeToForeground).toHaveBeenCalledTimes(1);
    });

    it('revalidates at the scheduled time with that time', () => {
        const { deps } = createHarness();
        const scheduler = createStakingScheduler(deps);

        scheduler.start();
        scheduler.scheduleRevalidation(NOW + 5 * MINUTE_MS);

        jest.advanceTimersByTime(5 * MINUTE_MS - 1);
        expect(deps.revalidate).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1);
        expect(deps.revalidate).toHaveBeenCalledWith(NOW + 5 * MINUTE_MS);
        expect(deps.revalidate).toHaveBeenCalledTimes(1);
    });

    it('arms the revalidation scheduled before the start once it starts', () => {
        const { deps } = createHarness();
        const scheduler = createStakingScheduler(deps);

        scheduler.scheduleRevalidation(NOW + 5 * MINUTE_MS);
        scheduler.start();
        jest.advanceTimersByTime(5 * MINUTE_MS);

        expect(deps.revalidate).toHaveBeenCalledWith(NOW + 5 * MINUTE_MS);
    });

    it('keeps only the latest revalidation time', () => {
        const { deps } = createHarness();
        const scheduler = createStakingScheduler(deps);

        scheduler.start();
        scheduler.scheduleRevalidation(NOW + 5 * MINUTE_MS);
        scheduler.scheduleRevalidation(NOW + 10 * MINUTE_MS);
        jest.advanceTimersByTime(5 * MINUTE_MS);
        expect(deps.revalidate).not.toHaveBeenCalled();

        scheduler.scheduleRevalidation(null);
        jest.advanceTimersByTime(DAY_MS);
        expect(deps.revalidate).not.toHaveBeenCalled();
    });

    it('waits a second at least for a time that has already passed', () => {
        const { deps } = createHarness();
        const scheduler = createStakingScheduler(deps);

        scheduler.start();
        scheduler.scheduleRevalidation(NOW - HOUR_MS);
        expect(deps.revalidate).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1000);
        expect(deps.revalidate).toHaveBeenCalledWith(NOW + 1000);
    });

    it('checks a far revalidation again after a day instead of firing early', () => {
        const { deps } = createHarness();
        const scheduler = createStakingScheduler(deps);

        scheduler.start();
        scheduler.scheduleRevalidation(NOW + 2 * DAY_MS + HOUR_MS);

        jest.advanceTimersByTime(2 * DAY_MS);
        expect(deps.revalidate).not.toHaveBeenCalled();

        jest.advanceTimersByTime(HOUR_MS);
        expect(deps.revalidate).toHaveBeenCalledWith(NOW + 2 * DAY_MS + HOUR_MS);
    });

    it('revalidates with the current time when the timer fires late', () => {
        const { deps } = createHarness();
        const scheduler = createStakingScheduler(deps);

        scheduler.start();
        scheduler.scheduleRevalidation(NOW + 5 * MINUTE_MS);

        jest.setSystemTime(NOW + HOUR_MS);
        jest.advanceTimersByTime(5 * MINUTE_MS);

        expect(deps.revalidate).toHaveBeenCalledWith(NOW + HOUR_MS + 5 * MINUTE_MS);
    });

    it('refreshes and revalidates a due position when the app comes to the foreground', () => {
        const { deps, foreground } = createHarness();
        const scheduler = createStakingScheduler(deps);

        scheduler.start();
        scheduler.scheduleRevalidation(NOW + 5 * MINUTE_MS);
        jest.setSystemTime(NOW + HOUR_MS);

        foreground();

        expect(deps.refresh).toHaveBeenCalledTimes(1);
        expect(deps.revalidate).toHaveBeenCalledWith(NOW + HOUR_MS);
    });

    it('only re-arms a revalidation that is not due yet on the foreground', () => {
        const { deps, foreground } = createHarness();
        const scheduler = createStakingScheduler(deps);

        scheduler.start();
        scheduler.scheduleRevalidation(NOW + HOUR_MS);
        jest.setSystemTime(NOW + 30 * MINUTE_MS);

        foreground();
        expect(deps.revalidate).not.toHaveBeenCalled();

        jest.advanceTimersByTime(30 * MINUTE_MS);
        expect(deps.revalidate).toHaveBeenCalledTimes(1);
    });

    it('uses the injected clock and timers', () => {
        const { deps } = createHarness();
        const callbacks: { callback: () => void; delayMs: number }[] = [];
        const scheduler = createStakingScheduler({
            ...deps,
            now: () => 500_000,
            timers: {
                schedule: (callback, delayMs) => {
                    callbacks.push({ callback, delayMs });

                    return () => {};
                },
            },
        });

        scheduler.start();
        scheduler.scheduleRevalidation(800_000);

        expect(callbacks.map(({ delayMs }) => delayMs)).toEqual([
            STAKING_PRODUCT_INFO_REFRESH_INTERVAL_MS,
            300_000,
        ]);

        callbacks[1]?.callback();
        expect(deps.revalidate).not.toHaveBeenCalled();
        expect(callbacks).toHaveLength(3);
    });
});
