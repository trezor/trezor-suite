import type { TimerId } from '@trezor/type-utils';

/**
 * Returns a debounce function that delays invoking `fn` until after `delayMs` milliseconds
 * have elapsed since the last call. Each call resets the timer.
 */
export const createDebounce = (delayMs: number) => {
    let timeout: TimerId | null = null;

    return (fn: () => void) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            timeout = null;
            fn();
        }, delayMs);
    };
};
