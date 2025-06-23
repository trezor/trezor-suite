import type { DBSchema, IDBPDatabase, IDBPTransaction, StoreNames } from 'idb';

export interface DBMigration<Schema extends DBSchema> {
    threshold: number;
    migrate: (
        db: IDBPDatabase<Schema>,
        tx: IDBPTransaction<Schema, StoreNames<Schema>[], 'versionchange'>,
    ) => Promise<void> | void;
}
