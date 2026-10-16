type Task<T> = () => Promise<T>;

/**
 * Returns a function that runs the given tasks with at most `concurrency` of them in flight. The
 * other tasks wait in a queue and start in the order in which they were added.
 */
export const createConcurrencyLimiter = (concurrency: number) => {
    let runningCount = 0;
    const queue: (() => void)[] = [];

    const startNext = () => {
        if (runningCount >= concurrency) return;

        const next = queue.shift();
        if (!next) return;

        runningCount++;
        next();
    };

    return <T>(task: Task<T>): Promise<T> =>
        new Promise<T>((resolve, reject) => {
            queue.push(() => {
                task()
                    .finally(() => {
                        runningCount--;
                        startNext();
                    })
                    .then(resolve, reject);
            });
            startNext();
        });
};
