import { IDBPDatabase } from 'idb';
import { MyDBV1 } from '@suite/storage';

export const migrate = async (
    db: IDBPDatabase<MyDBV1>,
    oldVersion: number,
    newVersion: number | null,
    transaction: any,
    // transaction: IDBPTransaction<MyDBV1, "transactions"[]>,
) => {
    console.log(`Migrating database from version ${oldVersion} to ${newVersion}`);

    // TODO: make separate file for each iterative migration
    if (newVersion === 9 && oldVersion === newVersion - 1) {
        // 1 => 2
        // added timestamp field
        let cursor = await transaction.store.openCursor();
        while (cursor) {
            console.log(cursor.key, cursor.value);
            const updateData = cursor.value;
            updateData.timestamp = 146684800000;
            const request = cursor.update(updateData);
            // eslint-disable-next-line no-await-in-loop
            cursor = await cursor.continue();
        }

        // create new index if not created before
        if (!transaction.store.indexNames.contains('timestamp')) {
            transaction.store.createIndex('timestamp', 'timestamp', { unique: false });
        }
    }
};
