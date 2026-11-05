/* eslint-disable no-console */
export type Log = (...messages: unknown[]) => void;

export const silentLog: Log = () => {};

// Console formatting is kept here so embedded callers can provide their own sink.

export const createConsoleLog =
    (write: Log = console.log): Log =>
    (...messages) =>
        write(new Date().toISOString(), '[wardd]', ...messages);

let nextActivityId = 0;

export const startActivity = (
    log: Log,
    operation: string,
    details: Record<string, unknown> = {},
) => {
    const id = ++nextActivityId;
    const started = performance.now();
    log('request', { id, operation, ...details });

    const finish = (result: Record<string, unknown>) =>
        log('response', {
            id,
            operation,
            durationMs: Math.round((performance.now() - started) * 100) / 100,
            ...result,
        });

    return {
        success: (result: Record<string, unknown> = {}) => finish({ outcome: 'ok', ...result }),
        failure: (error: unknown, result: Record<string, unknown> = {}) =>
            finish({
                outcome: 'error',
                error: error instanceof Error ? error.name : 'unknown',
                ...result,
            }),
    };
};
