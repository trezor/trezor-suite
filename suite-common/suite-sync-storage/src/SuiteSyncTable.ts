/**
 * This is an abstraction to define a subscribable entity storage in the
 * Suite Sync.
 */
export type SuiteSyncTable<T> = {
    update(entity: T): void;
    subscribe(onChange: (payload: T) => void): () => void;
};
