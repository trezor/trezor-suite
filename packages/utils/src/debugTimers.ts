// Store original functions
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;
const originalClearTimeout = global.clearTimeout;
const originalClearInterval = global.clearInterval;

// Create a list to store active timers and intervals
const activeTimers = new Set();
const activeIntervals = new Set();

// Monkey patch setTimeout
global.setTimeout = function (callback, delay, ...args) {
    const timerId = originalSetTimeout(() => {
        activeTimers.delete(timerId);
        callback.apply(this, args);
    }, delay);

    activeTimers.add(timerId);
    return timerId;
};

// Monkey patch setInterval
global.setInterval = function (callback, delay, ...args) {
    const intervalId = originalSetInterval(() => {
        callback.apply(this, args);
    }, delay);

    activeIntervals.add(intervalId);
    return intervalId;
};

// Monkey patch clearTimeout
global.clearTimeout = function (timerId) {
    activeTimers.delete(timerId);
    originalClearTimeout(timerId);
};

// Monkey patch clearInterval
global.clearInterval = function (intervalId) {
    activeIntervals.delete(intervalId);
    originalClearInterval(intervalId);
};

// Function to get all active timers and intervals
export const listActiveTimersAndIntervals = () => {
    return {
        timers: Array.from(activeTimers),
        intervals: Array.from(activeIntervals),
    };
};
