/**
 * Runs the queued tasks one at a time, in the order they were queued: a task starts only once the
 * one before it has settled. Each task keeps its own outcome — the returned promise resolves or
 * rejects with it — and a rejected task does not hold up the ones queued after it. A caller that
 * drops the returned promise still has a failed task reported as an unhandled rejection, as it
 * would be without the queue.
 */
export const createSerialQueue = () => {
    let previousTask: Promise<void> = Promise.resolve();

    return function enqueue<T>(task: () => Promise<T>): Promise<T> {
        const currentTask = previousTask.then(task);

        previousTask = currentTask.then(
            () => undefined,
            () => undefined,
        );

        // A promise of its own rather than `currentTask`: the chain above subscribes to that one,
        // which counts as handling its rejection, so a caller that drops the result would never
        // hear of a failed task — not even through the process's unhandled-rejection log.
        return currentTask.then(value => value);
    };
};
