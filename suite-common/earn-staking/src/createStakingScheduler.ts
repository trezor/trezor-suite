export const STAKING_PRODUCT_INFO_REFRESH_INTERVAL_MS = 60 * 1000;

const MIN_REVALIDATION_DELAY_MS = 1000;

// A timer longer than 2^31 ms fires at once; a far revalidation is checked again daily instead.
const MAX_TIMER_DELAY_MS = 24 * 60 * 60 * 1000;

export type StakingSchedulerTimers = {
    schedule: (callback: () => void, delayMs: number) => () => void;
};

export type SubscribeToForeground = (listener: () => void) => () => void;

export type StakingSchedulerDeps = {
    refresh: () => void;
    revalidate: (now: number) => void;
    now?: () => number;
    timers?: StakingSchedulerTimers;
    subscribeToForeground?: SubscribeToForeground;
};

export type StakingScheduler = {
    start: () => void;
    stop: () => void;
    scheduleRevalidation: (revalidateAt: number | null) => void;
};

export type StakingSchedulerDep = { stakingScheduler: StakingScheduler };

const defaultTimers: StakingSchedulerTimers = {
    schedule: (callback, delayMs) => {
        const id = setTimeout(callback, delayMs);

        return () => clearTimeout(id);
    },
};

const neverForeground: SubscribeToForeground = () => () => {};

export const createStakingScheduler = (deps: StakingSchedulerDeps): StakingScheduler => {
    const {
        refresh,
        revalidate,
        now = Date.now,
        timers = defaultTimers,
        subscribeToForeground = neverForeground,
    } = deps;

    let isRunning = false;
    let revalidateAt: number | null = null;
    let cancelTick: (() => void) | null = null;
    let cancelRevalidation: (() => void) | null = null;
    let unsubscribeForeground: (() => void) | null = null;

    const scheduleTick = () => {
        cancelTick = timers.schedule(() => {
            refresh();
            scheduleTick();
        }, STAKING_PRODUCT_INFO_REFRESH_INTERVAL_MS);
    };

    const clearRevalidationTimer = () => {
        cancelRevalidation?.();
        cancelRevalidation = null;
    };

    const revalidateIfDue = (): boolean => {
        if (revalidateAt === null || now() < revalidateAt) return false;

        clearRevalidationTimer();
        revalidate(now());

        return true;
    };

    const armRevalidation = () => {
        clearRevalidationTimer();

        if (!isRunning || revalidateAt === null) return;

        const delayMs = Math.min(
            Math.max(revalidateAt - now(), MIN_REVALIDATION_DELAY_MS),
            MAX_TIMER_DELAY_MS,
        );

        cancelRevalidation = timers.schedule(() => {
            if (!revalidateIfDue()) armRevalidation();
        }, delayMs);
    };

    const start = () => {
        if (isRunning) return;

        isRunning = true;
        scheduleTick();

        unsubscribeForeground = subscribeToForeground(() => {
            refresh();

            if (!revalidateIfDue()) armRevalidation();
        });

        armRevalidation();
    };

    const stop = () => {
        if (!isRunning) return;

        isRunning = false;

        cancelTick?.();
        cancelTick = null;

        clearRevalidationTimer();

        unsubscribeForeground?.();
        unsubscribeForeground = null;
    };

    const scheduleRevalidation = (nextRevalidateAt: number | null) => {
        revalidateAt = nextRevalidateAt;
        armRevalidation();
    };

    return { start, stop, scheduleRevalidation };
};
