/**
 * Runs the queued tasks one at a time, in the order they were queued: a task starts only once the
 * one before it has settled. Each task keeps its own outcome — the returned promise resolves or
 * rejects with it — and a rejected task does not hold up the ones queued after it.
 */
export const createSerialQueue = () => {
    let previousTask: Promise<void> = Promise.resolve();

    return function enqueue<T>(task: () => Promise<T>): Promise<T> {
        const currentTask = previousTask.then(task);

        previousTask = currentTask.then(
            () => undefined,
            () => undefined,
        );

        return currentTask;
    };
};
