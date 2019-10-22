// import { MyDBV1 } from '../types';
// import { STORE_TXS } from '../types';

export const migrate = async <TDBType>(
    // 'db' is declared but its value is never read
    // @ts-ignore
    db: any,
    oldVersion: number,
    newVersion: number | null,
    // @ts-ignore
    // 'transaction' is declared but its value is never read
    transaction: any,
    // transaction: IDBPTransaction<MyDBV1, "transactions"[]>,
) => {
    console.log(`Migrating database from version ${oldVersion} to ${newVersion}`);

    // TODO: make separate file for each iterative migration
    if (oldVersion < 2) {
        // upgrade to version 2
        // @ts-ignore TODO: fix
        db.createObjectStore('sendForm');
    }
    if (oldVersion < 3) {
        // upgrade to version 3
        // @ts-ignore TODO: fix
        db.deleteObjectStore('devices');
        // @ts-ignore TODO: fix
        db.createObjectStore('devices');
        // object store for accounts

        const accountsStore = db.createObjectStore('accounts', {
            keyPath: ['descriptor', 'symbol', 'deviceState'],
        });
        accountsStore.createIndex('deviceState', 'deviceState', { unique: false });

        // object store for discovery
        db.createObjectStore('discovery', { keyPath: 'deviceState' });
    }

    // EXAMPLE
    // if (oldVersion < 9) {
    //     // added timestamp field
    //     let cursor = await transaction.store.openCursor();

    //     while (cursor) {
    //         console.log(cursor.key, cursor.value);
    //         const updateData = cursor.value;
    //         updateData.timestamp = 146684800000;
    //         const request = cursor.update(updateData);
    //         // eslint-disable-next-line no-await-in-loop
    //         cursor = await cursor.continue();
    //     }

    //     // create new index if not created before
    //     if (!transaction.store.indexNames.contains('timestamp')) {
    //         transaction.store.createIndex('timestamp', 'timestamp', { unique: false });
    //     }
    // }
};
