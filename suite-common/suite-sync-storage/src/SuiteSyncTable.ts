export type EntityListener<T extends {}> = { onChange: (payload: T[]) => void };

/**
 * This is an abstraction to define a subscribable entity storage in the
 * Suite Sync.
 */
export type SuiteSyncTable<T extends {}> = {
    update(entity: Partial<T>): void;
    subscribe(params: EntityListener<T>): () => void;
};
