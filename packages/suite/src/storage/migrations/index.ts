import BigNumber from 'bignumber.js';
import { enhanceTransactionDetails } from '@suite/utils/wallet/transactionUtils';
import type { OnUpgradeFunc } from '@trezor/suite-storage';
import type { SuiteDBSchema } from '../definitions';
import type { State } from '@wallet-reducers/settingsReducer';
import type { CustomBackend, BlockbookUrl } from '@wallet-types/backend';
import type { Network, Account, Discovery } from '@wallet-types';
import type { BackendSettings } from '@wallet-reducers/blockchainReducer';
import type { DBWalletAccountTransaction } from '@trezor/suite/src/storage/definitions';
import type { GraphData } from '@wallet-types/graph';

type WalletWithBackends = {
    backends?: Partial<
        {
            [coin in Network['symbol']]: Omit<CustomBackend, 'coin'>;
        }
    >;
};

export const migrate: OnUpgradeFunc<SuiteDBSchema> = async (
    db,
    oldVersion,
    newVersion,
    transaction,
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

    if (oldVersion < 22) {
        let cursor = await transaction.objectStore('accounts').openCursor();
        while (cursor) {
            const account = cursor.value;
            if (account.symbol === 'ltc' && account.accountType === 'normal') {
                // change account type from normal to segwit
                account.accountType = 'segwit';
                cursor.update(account);
            }
            // eslint-disable-next-line no-await-in-loop
            cursor = await cursor.continue();
        }

        let discovery = await transaction.objectStore('discovery').openCursor();
        while (discovery) {
            const d = discovery.value;
            // reset discovery
            if (d.networks.includes('ltc')) {
                d.index = 0;
                d.loaded = 0;
                discovery.update(d);
            }
            // eslint-disable-next-line no-await-in-loop
            discovery = await discovery.continue();
        }
    }

    if (oldVersion < 23) {
        db.createObjectStore('messageSystem');
    }

    if (oldVersion < 24) {
        db.createObjectStore('formDrafts');
    }

    if (oldVersion < 25) {
        let cursor = await transaction.objectStore('walletSettings').openCursor();
        while (cursor) {
            const settings: State & { blockbookUrls?: BlockbookUrl[] } & WalletWithBackends =
                cursor.value;
            if (!settings.backends && settings.blockbookUrls) {
                settings.backends = settings.blockbookUrls.reduce<{ [key: string]: any }>(
                    (backends, { coin, url, tor }) =>
                        tor // automatically torified backends should be omitted
                            ? backends
                            : {
                                  ...backends,
                                  [coin]: {
                                      type: 'blockbook',
                                      urls: [...(backends[coin]?.urls || []), url],
                                  },
                              },
                    {},
                );
                delete settings.blockbookUrls;
                cursor.update(settings);
            }

            // eslint-disable-next-line no-await-in-loop
            cursor = await cursor.continue();
        }
    }

    if (oldVersion < 26) {
        let cursor = await transaction.objectStore('accounts').openCursor();
        while (cursor) {
            const account = cursor.value;
            if (account.symbol === 'vtc' && account.accountType === 'normal') {
                // change account type from normal to segwit
                account.accountType = 'segwit';
                cursor.update(account);
            }
            // eslint-disable-next-line no-await-in-loop
            cursor = await cursor.continue();
        }

        let discovery = await transaction.objectStore('discovery').openCursor();
        while (discovery) {
            const d = discovery.value;
            // reset discovery
            if (d.networks.includes('vtc')) {
                d.index = 0;
                d.loaded = 0;
                discovery.update(d);
            }
            // eslint-disable-next-line no-await-in-loop
            discovery = await discovery.continue();
        }
    }

    if (oldVersion < 27) {
        const backendSettings = db.createObjectStore('backendSettings');
        let cursor = await transaction.objectStore('walletSettings').openCursor();
        while (cursor) {
            const settings: State & WalletWithBackends = cursor.value;
            const { backends = {}, ...rest } = settings;
            Object.entries(backends).forEach(([coin, { type, urls }]) => {
                const settings: BackendSettings = {
                    selected: type,
                    urls: {
                        [type]: urls,
                    },
                };
                backendSettings.add(settings, coin as Network['symbol']);
            });

            cursor.update(rest);
            // eslint-disable-next-line no-await-in-loop
            cursor = await cursor.continue();
        }
    }

    if (oldVersion < 28) {
        const devicesStore = transaction.objectStore('devices');
        devicesStore.openCursor().then(function update(cursor): Promise<void> | undefined {
            if (!cursor) {
                return;
            }
            const device = cursor.value;

            if (device.state?.includes('undefined')) {
                device.state = device.state.replace('undefined', '0');
                cursor.update(device);
            }

            return cursor.continue().then(update);
        });

        const accounts: Account[] = [];
        const accountsStore = transaction.objectStore('accounts');
        accountsStore
            .openCursor()
            .then(function read(cursor): Promise<void> | undefined {
                if (!cursor) {
                    return;
                }
                const account = cursor.value;
                accounts.push(account);
                return cursor.continue().then(read);
            })
            .then(() => {
                db.deleteObjectStore('accounts');
            })
            .then(() => {
                const accountsStore = db.createObjectStore('accounts', {
                    keyPath: ['descriptor', 'symbol', 'deviceState'],
                });
                accountsStore.createIndex('deviceState', 'deviceState', { unique: false });

                return accountsStore;
            })
            .then(accountsStore => {
                accounts.forEach(account => {
                    account.deviceState = account.deviceState.replace('undefined', '0');
                    account.key = account.key.replace('undefined', '0');
                    accountsStore.add(account);
                });
            });

        const txs: DBWalletAccountTransaction[] = [];
        const txsStore = transaction.objectStore('txs');
        txsStore
            .openCursor()
            .then(function read(cursor): Promise<void> | undefined {
                if (!cursor) {
                    return;
                }
                const tx = cursor.value;
                txs.push(tx);
                return cursor.continue().then(read);
            })
            .then(() => {
                db.deleteObjectStore('txs');
            })
            .then(() => {
                const txsStore = db.createObjectStore('txs', {
                    keyPath: ['tx.deviceState', 'tx.descriptor', 'tx.txid', 'tx.type'],
                });
                txsStore.createIndex('txid', 'tx.txid', { unique: false });
                txsStore.createIndex('order', 'order', { unique: false });
                txsStore.createIndex('blockTime', 'tx.blockTime', { unique: false });
                txsStore.createIndex('deviceState', 'tx.deviceState', { unique: false });
                txsStore.createIndex(
                    'accountKey',
                    ['tx.descriptor', 'tx.symbol', 'tx.deviceState'],
                    {
                        unique: false,
                    },
                );
                return txsStore;
            })
            .then(txsStore => {
                txs.forEach(tx => {
                    tx.tx.deviceState = tx.tx.deviceState.replace('undefined', '0');
                    txsStore.add(tx);
                });
            });

        // graph
        const graphs: GraphData[] = [];
        const graphStore = transaction.objectStore('graph');
        graphStore
            .openCursor()
            .then(function read(cursor): Promise<void> | undefined {
                if (!cursor) {
                    return;
                }
                const graph = cursor.value;
                graphs.push(graph);
                return cursor.continue().then(read);
            })
            .then(() => {
                db.deleteObjectStore('graph');
            })
            .then(() => {
                // graph
                const graphStore = db.createObjectStore('graph', {
                    keyPath: ['account.descriptor', 'account.symbol', 'account.deviceState'],
                });
                graphStore.createIndex('accountKey', [
                    'account.descriptor',
                    'account.symbol',
                    'account.deviceState',
                ]);

                graphStore.createIndex('deviceState', 'account.deviceState');

                return graphStore;
            })
            .then(graphStore => {
                graphs.forEach(graph => {
                    graph.account.deviceState = graph.account.deviceState.replace('undefined', '0');
                    graphStore.add(graph);
                });
            });

        // discovery
        const discoveries: Discovery[] = [];
        const discoveryStore = transaction.objectStore('discovery');
        discoveryStore
            .openCursor()
            .then(function read(cursor): Promise<void> | undefined {
                if (!cursor) {
                    return;
                }
                const discovery = cursor.value;
                discoveries.push(discovery);
                return cursor.continue().then(read);
            })
            .then(() => {
                db.deleteObjectStore('discovery');
            })
            .then(() =>
                // object store for discovery
                db.createObjectStore('discovery', { keyPath: 'deviceState' }),
            )
            .then(discoveryStore => {
                discoveries.forEach(discovery => {
                    discovery.deviceState = discovery.deviceState.replace('undefined', '0');
                    discoveryStore.add(discovery);
                });
            });
    }
};
