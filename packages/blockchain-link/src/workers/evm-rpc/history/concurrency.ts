/** Preserves input order while keeping at most `limit` promises in flight. */
export const mapWithConcurrency = async <T, R>(
    items: readonly T[],
    limit: number,
    worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
    const results: R[] = new Array(items.length);
    let next = 0;

    const run = async () => {
        for (let index = next++; index < items.length; index = next++) {
            results[index] = await worker(items[index] as T, index);
        }
    };

    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));

    return results;
};
