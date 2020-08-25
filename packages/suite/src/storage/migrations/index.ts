import { OnUpgradeFunc } from '@trezor/suite-storage';
import { SuiteDBSchema } from '..';

export const migrate = async (
    db: Parameters<OnUpgradeFunc<SuiteDBSchema>>['0'],
    oldVersion: Parameters<OnUpgradeFunc<SuiteDBSchema>>['1'],
    newVersion: Parameters<OnUpgradeFunc<SuiteDBSchema>>['2'],
    transaction: Parameters<OnUpgradeFunc<SuiteDBSchema>>['3'],
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
    if (oldVersion < 14) {
        // added graph object store
        const graphStore = db.createObjectStore('graph', {
            keyPath: ['account.descriptor', 'account.symbol', 'account.deviceState'],
        });
        graphStore.createIndex('accountKey', [
            'account.descriptor',
            'account.symbol',
            'account.deviceState',
        ]);
        graphStore.createIndex('deviceState', 'account.deviceState');
    }

    if (oldVersion < 15) {
        db.createObjectStore('metadata');

        const accountsStore = transaction.objectStore('accounts');
        accountsStore
            .openCursor()
            .then(function addMetadataKeys(cursor): Promise<void> | undefined {
                if (!cursor) {
                    return;
                }
                const account = cursor.value;

                account.metadata = {
                    key: '',
                    fileName: '',
                    aesKey: '',
                    outputLabels: {},
                    addressLabels: {},
                };
                account.key = `${account.descriptor}-${account.symbol}-${account.deviceState}`;
                cursor.update(account);

                return cursor.continue().then(addMetadataKeys);
            });

        const devicesStore = transaction.objectStore('devices');
        devicesStore.openCursor().then(function addMetadataKeys(cursor): Promise<void> | undefined {
            if (!cursor) {
                return;
            }
            const device = cursor.value;

            device.metadata = {
                status: 'disabled',
            };
            cursor.update(device);

            return cursor.continue().then(addMetadataKeys);
        });
    }
};
