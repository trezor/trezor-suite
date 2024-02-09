import type { StoreNames, StoreValue, IDBPTransaction } from 'idb';
import type { SuiteDBSchema } from '../definitions';

/**
 * Iterates over specified object store and applies `update` function to all the entries
 * @param update If non-null value is returned, db entry is updated with the returned value.
 * If null is returned, entry is removed from db.
 * If nothing (void/undefined) is returned, entry is left untouched.
 */
export const updateAll = async <
    T extends StoreNames<SuiteDBSchema>,
    OldValueType = StoreValue<SuiteDBSchema, T>,
>(
    transaction: IDBPTransaction<SuiteDBSchema, StoreNames<SuiteDBSchema>[], 'versionchange'>,
    store: T,
    update: (old: OldValueType) => StoreValue<SuiteDBSchema, T> | null | void,
): Promise<void> => {
    let cursor = await transaction.objectStore(store).openCursor();
    while (cursor) {
        const oldObj = cursor.value as OldValueType;
        const newObj = update(oldObj);

        if (newObj) {
            await cursor.update(newObj);
        } else if (newObj === null) {
            await cursor.delete();
        }

        cursor = await cursor.continue();
    }
};
