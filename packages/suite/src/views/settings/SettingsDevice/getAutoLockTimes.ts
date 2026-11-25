const MILLISECONDS_IN_SECOND = 1000;

type GetAutoLockTimesParams = {
    presetAutoLockTimes: readonly number[];
    autoLockDelay: number;
};

/**
 * Returns the auto-lock times to offer, in seconds, for a device holding the given delay in
 * milliseconds. A delay that is not among the presets is offered too, so that it can be shown
 * as the selected value.
 */
export const getAutoLockTimes = ({
    presetAutoLockTimes,
    autoLockDelay,
}: GetAutoLockTimesParams): number[] => {
    const currentAutoLockTime = autoLockDelay / MILLISECONDS_IN_SECOND;

    if (presetAutoLockTimes.includes(currentAutoLockTime)) {
        return [...presetAutoLockTimes];
    }

    return [...presetAutoLockTimes, currentAutoLockTime].toSorted((timeA, timeB) => timeA - timeB);
};
