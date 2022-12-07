export type ScheduledAction<T> = (signal?: AbortSignal) => Promise<T>;

export type ScheduleActionParams = {
    delay?: number; // How many ms wait before calling action for the first time (default = none)
    deadline?: number; // Timestamp in which all attempts are rejected (default = none)
    attempts?: number; // How many attempts before failure (default = one, or infinite when deadline is set)
    timeout?: number; // How many ms wait for a single action attempt (default = indefinitely)
    gap?: number; // How many ms wait between two consecutive attempts (default = none)
    signal?: AbortSignal;
};

const abortedBySignal = () => new Error('Aborted by signal');
const abortedByDeadline = () => new Error('Aborted by deadline');
const abortedByTimeout = () => new Error('Aborted by timeout');

const resolveAfterMs = (ms: number | undefined, clear: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
        if (clear.aborted) return reject();
        if (ms === undefined) return resolve();
        const timeout = setTimeout(resolve, ms);
        const onClear = () => {
            clearTimeout(timeout);
            clear.removeEventListener('abort', onClear);
            reject();
        };
        clear.addEventListener('abort', onClear);
    });

const rejectAfterMs = (ms: number | undefined, reason: () => Error, clear: AbortSignal) =>
    new Promise<never>((_, reject) => {
        if (clear.aborted) return reject();
        const timeout = ms !== undefined ? setTimeout(() => reject(reason()), ms) : undefined;
        const onClear = () => {
            clearTimeout(timeout);
            clear.removeEventListener('abort', onClear);
            reject();
        };
        clear.addEventListener('abort', onClear);
    });

const rejectWhenAborted = (signal: AbortSignal | undefined, clear: AbortSignal) =>
    new Promise<never>((_, reject) => {
        if (clear.aborted) return reject();
        if (signal?.aborted) return reject(abortedBySignal());
        const onAbort = () => reject(abortedBySignal());
        signal?.addEventListener('abort', onAbort);
        const onClear = () => {
            signal?.removeEventListener('abort', onAbort);
            clear.removeEventListener('abort', onClear);
            reject();
        };
        clear.addEventListener('abort', onClear);
    });

const resolveAction = async <T>(action: ScheduledAction<T>, clear: AbortSignal) => {
    const aborter = new AbortController();
    const onClear = () => aborter.abort();
    if (clear.aborted) onClear();
    clear.addEventListener('abort', onClear);
    try {
        return await new Promise<T>(resolve => resolve(action(aborter.signal)));
    } finally {
        clear.removeEventListener('abort', onClear);
    }
};

const attemptLoop = async <T>(
    attempts: number,
    attempt: ScheduledAction<T>,
    failure: () => Promise<void>,
    clear: AbortSignal,
) => {
    // Tries only (attempts - 1) times, because the last attempt throws its error
    for (let a = 0; a < attempts - 1; a++) {
        if (clear.aborted) break;
        try {
            // eslint-disable-next-line no-await-in-loop
            return await attempt();
        } catch {
            // eslint-disable-next-line no-await-in-loop
            await failure();
        }
    }
    return clear.aborted ? Promise.reject() : attempt();
};

export const scheduleAction = async <T>(
    action: ScheduledAction<T>,
    params: ScheduleActionParams,
) => {
    const { signal, delay, attempts, timeout, deadline, gap } = params;
    const deadlineMs = deadline && deadline - Date.now();
    const attemptCount = attempts ?? (deadline ? Infinity : 1);
    const clearAborter = new AbortController();
    const clear = clearAborter.signal;

    try {
        return await Promise.race([
            rejectWhenAborted(signal, clear),
            rejectAfterMs(deadlineMs, abortedByDeadline, clear),
            resolveAfterMs(delay, clear).then(() =>
                attemptLoop(
                    attemptCount,
                    () =>
                        Promise.race([
                            rejectAfterMs(timeout, abortedByTimeout, clear),
                            resolveAction(action, clear),
                        ]),
                    () => resolveAfterMs(gap ?? 0, clear),
                    clear,
                ),
            ),
        ]);
    } finally {
        clearAborter.abort();
    }
};
