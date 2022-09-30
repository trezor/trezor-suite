import { StoreNames, StoreValue, IDBPTransaction } from 'idb';
import type { SuiteDBSchema } from '../definitions';

export const updateAll = async <
    T extends StoreNames<SuiteDBSchema>,
    OldValueType = StoreValue<SuiteDBSchema, T>,
>(
    transaction: IDBPTransaction<SuiteDBSchema, StoreNames<SuiteDBSchema>[], 'versionchange'>,
    store: T,
    update: (old: OldValueType) => StoreValue<SuiteDBSchema, T> | undefined,
): Promise<void> => {
    let cursor = await transaction.objectStore(store).openCursor();
    while (cursor) {
        const oldObj = cursor.value as OldValueType;
        const newObj = update(oldObj);

        if (newObj) {
            // eslint-disable-next-line no-await-in-loop
            await cursor.update(newObj);
        }

        // eslint-disable-next-line no-await-in-loop
        cursor = await cursor.continue();
    }
};
