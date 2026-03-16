import { type Result } from '@trezor/type-utils';

export type EntityListener<T extends {}> = { onChange: (payload: T[]) => void };

export type SuiteSyncUpdateError = { type: 'SuiteSyncUpdateError'; caused: any };

export const createSuiteSyncUpdateError = (caused: any): SuiteSyncUpdateError => ({
    type: 'SuiteSyncUpdateError',
    caused,
});

/**
 * This is an abstraction to define a subscribable entity storage in the
 * Suite Sync.
 */
export type SuiteSyncTable<T extends {}> = {
    update(entity: Partial<T>): Result<void, SuiteSyncUpdateError>;
    subscribe(params: EntityListener<T>): () => void;
};

export type InferSuiteSyncTableEntity<T> = T extends SuiteSyncTable<infer E> ? E : never;
