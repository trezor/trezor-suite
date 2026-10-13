export const PERFORMANCE_LOG_PREFIX = '__TREZOR_PERF__';

// react-native-lighthouse only emits its final report once a first input is captured or this
// timeout elapses, and it clears the timer on unmount. Keeping it well under the time a Detox
// flow spends on a screen is what makes the sample survive the navigation away from it.
export const FID_TIMEOUT_MS = 1000;
