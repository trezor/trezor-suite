import { DEFAULT_ARK_TIMEOUT_MS } from './arkConstants';

// This wraps an SDK promise with a timeout that names the step that timed
// out. Useful because round participation and indexer queries can hang
// without surfacing a clear error if the operator is overloaded.
export const withArkTimeout = async <TResult>(
    promise: Promise<TResult>,
    stepName: string,
    timeoutMs = DEFAULT_ARK_TIMEOUT_MS,
): Promise<TResult> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
        return await Promise.race([
            promise,
            new Promise<TResult>((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(
                        new Error(
                            `Ark operation timed out during ${stepName} after ${timeoutMs} ms`,
                        ),
                    );
                }, timeoutMs);
            }),
        ]);
    } finally {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
    }
};
