import { type LegacyOriginStorage } from '@suite/desktop-app-api';
import { installFakeIndexedDb } from '@suite-common/test-utils/fakeIndexedDb';

import { importLegacyOriginStorage } from './importLegacyOriginStorage';

const SUITE_DB_VERSION = 0x1a0b0000;

const openDatabase = (name: string, version?: number, upgrade?: (db: IDBDatabase) => void) =>
    new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(name, version);
        request.onupgradeneeded = () => upgrade?.(request.result);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

const readAll = (db: IDBDatabase, storeName: string) =>
    new Promise<{ keys: IDBValidKey[]; values: unknown[] }>((resolve, reject) => {
        const store = db.transaction(storeName, 'readonly').objectStore(storeName);
        const keysRequest = store.getAllKeys();
        const valuesRequest = store.getAll();
        valuesRequest.onsuccess = () =>
            resolve({ keys: keysRequest.result, values: valuesRequest.result });
        valuesRequest.onerror = () => reject(valuesRequest.error);
    });

const TX_KEY_PATH = ['tx.deviceState', 'tx.descriptor', 'tx.txid', 'tx.type'];
const ACCOUNT_KEY_PATH = ['tx.descriptor', 'tx.symbol', 'tx.deviceState'];

const createTransaction = (txid: string, type: string, order: number) => ({
    order,
    tx: { deviceState: 'state', descriptor: 'xpub', txid, type, symbol: 'btc' },
});

const createStorage = (): LegacyOriginStorage => ({
    databases: [
        {
            name: 'trezor-suite',
            version: SUITE_DB_VERSION,
            objectStores: [
                {
                    name: 'suiteSettings',
                    keyPath: null,
                    autoIncrement: false,
                    indexes: [],
                    records: [{ key: 'suite', value: { settings: { language: 'cs' } } }],
                },
                {
                    name: 'txs',
                    keyPath: TX_KEY_PATH,
                    autoIncrement: false,
                    indexes: [
                        { name: 'txid', keyPath: 'tx.txid', unique: false, multiEntry: false },
                        {
                            name: 'accountKey',
                            keyPath: ACCOUNT_KEY_PATH,
                            unique: false,
                            multiEntry: false,
                        },
                    ],
                    records: [
                        {
                            key: ['state', 'xpub', 'tx-1', 'sent'],
                            value: createTransaction('tx-1', 'sent', 0),
                        },
                        {
                            key: ['state', 'xpub', 'tx-2', 'recv'],
                            value: createTransaction('tx-2', 'recv', 1),
                        },
                    ],
                },
                {
                    name: 'historicRates',
                    keyPath: null,
                    autoIncrement: false,
                    indexes: [],
                    records: [],
                },
            ],
        },
    ],
    localStorage: { 'analytics-confirmed-and-enabled': 'true' },
    files: [],
});

describe(importLegacyOriginStorage.name, () => {
    beforeEach(() => {
        installFakeIndexedDb();
        localStorage.clear();
    });

    it('recreates the databases at their version with the stores, indexes and records', async () => {
        const result = await importLegacyOriginStorage(createStorage());

        expect(result).toEqual({ success: true, payload: { isImported: true } });

        const db = await openDatabase('trezor-suite');
        expect(db.version).toBe(SUITE_DB_VERSION);
        expect(Array.from(db.objectStoreNames)).toEqual(['historicRates', 'suiteSettings', 'txs']);

        const txs = db.transaction('txs', 'readonly').objectStore('txs');
        expect(txs.keyPath).toEqual(TX_KEY_PATH);
        expect(txs.autoIncrement).toBe(false);
        expect(Array.from(txs.indexNames)).toEqual(['accountKey', 'txid']);
        expect(txs.index('accountKey').keyPath).toEqual(ACCOUNT_KEY_PATH);
        expect(txs.index('txid').unique).toBe(false);

        expect(await readAll(db, 'txs')).toEqual({
            keys: [
                ['state', 'xpub', 'tx-1', 'sent'],
                ['state', 'xpub', 'tx-2', 'recv'],
            ],
            values: [createTransaction('tx-1', 'sent', 0), createTransaction('tx-2', 'recv', 1)],
        });
        expect(await readAll(db, 'suiteSettings')).toEqual({
            keys: ['suite'],
            values: [{ settings: { language: 'cs' } }],
        });
        expect(await readAll(db, 'historicRates')).toEqual({ keys: [], values: [] });
        db.close();
    });

    it('writes the localStorage entries', async () => {
        await importLegacyOriginStorage(createStorage());

        expect(localStorage.getItem('analytics-confirmed-and-enabled')).toBe('true');
    });

    it('leaves a database that already exists here untouched', async () => {
        const existing = await openDatabase('trezor-suite', 1, db => {
            db.createObjectStore('suiteSettings');
        });
        existing.close();

        const result = await importLegacyOriginStorage(createStorage());

        expect(result).toEqual({ success: true, payload: { isImported: false } });
        const db = await openDatabase('trezor-suite');
        expect(db.version).toBe(1);
        expect(Array.from(db.objectStoreNames)).toEqual(['suiteSettings']);
        db.close();
        expect(localStorage.getItem('analytics-confirmed-and-enabled')).toBeNull();
    });

    it('leaves no database behind when a record cannot be stored', async () => {
        const storage = createStorage();
        const invalidRecord = { key: { not: 'a valid key' }, value: {} };
        const [database] = storage.databases;
        const [suiteSettings] = database?.objectStores ?? [];
        suiteSettings?.records.push(invalidRecord);

        const result = await importLegacyOriginStorage(storage);

        expect(result.success).toBe(false);
        expect((await indexedDB.databases()).map(info => info.name)).toEqual([]);
    });
});
