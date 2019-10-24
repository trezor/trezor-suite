import { OnUpgradeProps } from '@trezor/suite-storage';

export const migrate = async <TDBType>(
    // 'db' is declared but its value is never read
    // @ts-ignore
    db: OnUpgradeProps<SuiteDBSchema>['db'],
    oldVersion: OnUpgradeProps<TDBType>['oldVersion'],
    newVersion: OnUpgradeProps<TDBType>['newVersion'],
    transaction: OnUpgradeProps<TDBType>['transaction'],
) => {
    console.log(`Migrating database from version ${oldVersion} to ${newVersion}`);

    // TODO: make separate file for each iterative migration

    // EXAMPLES

    // if (oldVersion < 3) {
    //     // upgrade to version 3
    //     db.deleteObjectStore('devices');
    //     db.createObjectStore('devices');

    //     // object store for accounts
    //     const accountsStore = db.createObjectStore('accounts', {
    //         keyPath: ['descriptor', 'symbol', 'deviceState'],
    //     });
    //     accountsStore.createIndex('deviceState', 'deviceState', { unique: false });

    //     // object store for discovery
    //     db.createObjectStore('discovery', { keyPath: 'deviceState' });
    // }

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
