import { enhanceTransactionDetails } from '@suite/utils/wallet/transactionUtils';
import { OnUpgradeFunc } from '@trezor/suite-storage';
import BigNumber from 'bignumber.js';
import { SuiteDBSchema } from '../definitions';

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

    if (oldVersion < 16) {
        // object store for send form
        // @ts-ignore sendForm doesn't exists anymore
        db.deleteObjectStore('sendForm');
        db.createObjectStore('sendFormDrafts');
    }

    if (oldVersion < 17) {
        db.createObjectStore('coinmarketTrades');
    }

    if (oldVersion < 18) {
        const devicesStore = transaction.objectStore('devices');
        devicesStore.openCursor().then(function addWalletNumber(cursor): Promise<void> | undefined {
            if (!cursor) {
                return;
            }
            const device = cursor.value;

            device.walletNumber = device.instance;
            cursor.update(device);

            return cursor.continue().then(addWalletNumber);
        });
    }

    if (oldVersion < 19) {
        // no longer uses keyPath to generate primary key
        db.deleteObjectStore('fiatRates');
        db.createObjectStore('fiatRates');
    }

    if (oldVersion < 20) {
        // enhance tx.details
        let cursor = await transaction.objectStore('txs').openCursor();
        while (cursor) {
            const tx = cursor.value;
            if (tx.tx.details) {
                tx.tx.details = enhanceTransactionDetails(tx.tx, tx.tx.symbol);
            }

            cursor.update(tx);
            // eslint-disable-next-line no-await-in-loop
            cursor = await cursor.continue();
        }
    }

    if (oldVersion < 21) {
        // do the same thing as in blockchain-link's transformTransaction
        let cursor = await transaction.objectStore('txs').openCursor();
        const symbolsToExclude = ['eth', 'etc', 'xrp', 'trop', 'txrp'];
        while (cursor) {
            const tx = cursor.value;
            if (!tx.tx.totalSpent) {
                if (!symbolsToExclude.includes(tx.tx.symbol)) {
                    // btc-like txs
                    if (tx.tx.type === 'sent') {
                        // fix tx.amount = tx.amount - tx.fee for btc-like sent txs
                        tx.tx.totalSpent = tx.tx.amount;
                        tx.tx.amount = new BigNumber(tx.tx.amount).minus(tx.tx.fee).toString();
                    } else {
                        tx.tx.totalSpent = tx.tx.amount;
                    }
                } else if (tx.tx.type === 'sent') {
                    // eth, xrp like sent txs
                    if (tx.tx.ethereumSpecific) {
                        if (tx.tx.tokens.length > 0 || tx.tx.ethereumSpecific.status === 0) {
                            // eth with tokens (amount === fee == totalSpent)
                            tx.tx.totalSpent = tx.tx.amount;
                        } else {
                            tx.tx.totalSpent = new BigNumber(tx.tx.amount)
                                .plus(tx.tx.fee)
                                .toString();
                        }
                    } else {
                        tx.tx.totalSpent = new BigNumber(tx.tx.amount).plus(tx.tx.fee).toString();
                    }
                } else {
                    // self, recv txs
                    tx.tx.totalSpent = tx.tx.amount;
                }
                cursor.update(tx);
            }
            // eslint-disable-next-line no-await-in-loop
            cursor = await cursor.continue();
        }
    }
};
