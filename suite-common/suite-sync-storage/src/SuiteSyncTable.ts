import { type Result } from '@trezor/type-utils';

export type EntityListener<T extends object> = {
    onChange: (payload: T[]) => void;
};

/**
 * `reason` carries only validation discriminators (type names, reason kinds, column names).
 * The rejected entity must never be attached, because this error is reported to Sentry.
 */
export type SuiteSyncUpdateError = { type: 'SuiteSyncUpdateError'; reason: string };

export const createSuiteSyncUpdateError = (reason: string): SuiteSyncUpdateError => ({
    type: 'SuiteSyncUpdateError',
    reason,
});

/**
 * This is an abstraction to define a subscribable entity storage in the
 * Suite Sync.
 */
export type SuiteSyncTable<T extends object> = {
    update(entity: Partial<T>): Result<void, SuiteSyncUpdateError>;
    subscribe(params: EntityListener<T>): () => void;
};

export type InferSuiteSyncTableEntity<T> = T extends SuiteSyncTable<infer E> ? E : never;
