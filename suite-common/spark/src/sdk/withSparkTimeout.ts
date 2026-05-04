const DEFAULT_SPARK_TIMEOUT_MS = 30_000;

export const withSparkTimeout = async <TResult>(
    promise: Promise<TResult>,
    stepName: string,
    timeoutMs = DEFAULT_SPARK_TIMEOUT_MS,
): Promise<TResult> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
        return await Promise.race([
            promise,
            new Promise<TResult>((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(
                        new Error(
                            `Spark operation timed out during ${stepName} after ${timeoutMs} ms`,
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
