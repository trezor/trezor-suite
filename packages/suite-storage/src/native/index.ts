import {
    StoreNames,
    StoreValue,
    StoreKey,
    IndexNames,
    IndexKey,
    IDBPDatabase,
    IDBPTransaction,
} from 'idb';
import { StorageUpdateMessage, StorageMessageEvent } from './types';

export type OnUpgradeFunc<TDBStructure> = (
    db: IDBPDatabase<TDBStructure>,
    oldVersion: number,
    newVersion: number | null,
    transaction: IDBPTransaction<TDBStructure, StoreNames<TDBStructure>[]>
) => Promise<void>;
class CommonDB<TDBStructure> {
    private static instance: CommonDB<any>;
    dbName!: string;
    version!: number;
    db!: IDBPDatabase<TDBStructure>;
    broadcastChannel!: any;
    supported: boolean | undefined;
    blocking = false;
    blocked = false;
    onUpgrade!: OnUpgradeFunc<TDBStructure>;
    onDowngrade!: () => any;
    onBlocked?: () => void;
    onBlocking?: () => void;

    constructor(
        dbName: string,
        version: number,
        onUpgrade: OnUpgradeFunc<TDBStructure>,
        onDowngrade: () => any,
        onBlocked?: () => void,
        onBlocking?: () => void
    ) {
        if (CommonDB.instance) {
            return CommonDB.instance;
        }

        this.dbName = dbName;
        this.version = version;
        this.onUpgrade = onUpgrade.bind(this);
        this.onDowngrade = onDowngrade.bind(this);
        this.onBlocked = onBlocked;
        this.onBlocking = onBlocking;
        this.supported = false;
        this.blocking = false;
        this.blocked = false;

        // @ts-ignore
        this.db = null;
        // create global instance of broadcast channel
        this.broadcastChannel = null;

        CommonDB.instance = this;
    }

    static isDBAvailable = (): Promise<boolean> => {
        // Firefox doesn't support indexedDB while in incognito mode, but still returns valid window.indexedDB object.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=781982
        // so we need to try accessing the IDB. try/catch around idb.open() does not catch the error (bug in idb?), that's why we use callbacks.
        // this solution calls callback function from within onerror/onsuccess event handlers.
        // For other browsers checking the window.indexedDB should be enough.
        return Promise.resolve(false);
        // const isFirefox = navigator && navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        // return new Promise((resolve, _reject) => {
        //     if (isFirefox) {
        //         const r = indexedDB.open('test');
        //         r.onerror = () => resolve(false);
        //         r.onsuccess = () => resolve(true);
        //     } else {
        //         // @ts-ignore
        //         const idbAvailable = !!indexedDB || !!window.indexedDB || !!global.indexedDB;
        //         if (idbAvailable) {
        //             resolve(true);
        //         } else {
        //             resolve(false);
        //         }
        //     }
        // });
    };

    isSupported = (): Promise<boolean> => {
        this.supported = false;
        return Promise.resolve(false);
    };

    notify = (_store: StoreNames<TDBStructure>, _keys: any[]) => {};

    onChange = (_handler: (event: StorageMessageEvent<TDBStructure>) => any) => {};

    getDB = (): Promise<IDBPDatabase<TDBStructure>> => {
        // @ts-ignore
        return Promise.resolve();
    };

    addItem = <
        TStoreName extends StoreNames<TDBStructure>,
        TItem extends StoreValue<TDBStructure, TStoreName>,
        TKey extends StoreKey<TDBStructure, TStoreName>
    >(
        _store: TStoreName,
        _item: TItem,
        _key?: TKey,
        _upsert?: boolean
    ): Promise<StoreKey<TDBStructure, TStoreName>> => {
        // @ts-ignore
        return Promise.resolve();
    };

    addItems = <
        TStoreName extends StoreNames<TDBStructure>,
        TItem extends StoreValue<TDBStructure, TStoreName>
    >(
        _store: TStoreName,
        _items: TItem[],
        _upsert?: boolean
    ) => {
        return Promise.resolve();
    };

    getItemByPK = <
        TStoreName extends StoreNames<TDBStructure>,
        TKey extends StoreKey<TDBStructure, TStoreName>
    >(
        _store: TStoreName,
        _primaryKey: TKey
    ): Promise<StoreValue<TDBStructure, TStoreName> | undefined> => {
        // @ts-ignore
        return Promise.resolve();
    };

    getItemByIndex = <
        TStoreName extends StoreNames<TDBStructure>,
        TIndexName extends IndexNames<TDBStructure, TStoreName>,
        TKey extends IndexKey<TDBStructure, TStoreName, TIndexName>
    >(
        _store: TStoreName,
        _indexName: TIndexName,
        _key: TKey
    ) => {
        return Promise.resolve();
    };

    updateItemByIndex = <
        TStoreName extends StoreNames<TDBStructure>,
        TIndexName extends IndexNames<TDBStructure, TStoreName>,
        TKey extends IndexKey<TDBStructure, TStoreName, TIndexName>
    >(
        _store: TStoreName,
        _indexName: TIndexName,
        _key: TKey,
        _updateObject: { [key: string]: any }
    ) => {
        return Promise.resolve();
    };

    removeItemByPK = <
        TStoreName extends StoreNames<TDBStructure>,
        TKey extends StoreKey<TDBStructure, TStoreName>
    >(
        _store: TStoreName,
        _key: TKey
    ) => {
        return Promise.resolve();
    };

    removeItemByIndex = <
        TStoreName extends StoreNames<TDBStructure>,
        TIndexName extends IndexNames<TDBStructure, TStoreName>,
        TKey extends IndexKey<TDBStructure, TStoreName, TIndexName>
    >(
        _store: TStoreName,
        _indexName: TIndexName,
        _key: TKey
    ) => {
        return Promise.resolve();
    };

    getItemsExtended = <
        TStoreName extends StoreNames<TDBStructure>,
        TIndexName extends IndexNames<TDBStructure, TStoreName>
    >(
        _store: TStoreName,
        _indexName?: TIndexName,
        _filters?: { key?: any; offset?: number; count?: number; reverse?: boolean }
    ) => {
        return (Promise.resolve() as unknown) as Promise<StoreValue<TDBStructure, TStoreName>[]>;
    };

    getItemsWithKeys = <TStoreName extends StoreNames<TDBStructure>>(_store: TStoreName) => {
        return (Promise.resolve() as unknown) as Promise<
            {
                key: unknown extends IndexNames<TDBStructure, TStoreName>
                    ? IndexKey<TDBStructure, TStoreName, IndexNames<TDBStructure, TStoreName>>
                    : StoreKey<TDBStructure, TStoreName>;
                value: StoreValue<TDBStructure, TStoreName>;
            }[]
        >;
    };

    clearStores = <TStoreName extends StoreNames<TDBStructure>>(_storeNames?: TStoreName[]) => {
        return Promise.resolve();
    };

    static removeStores = <TDBStructure>(_db: IDBPDatabase<TDBStructure>) => {
        return Promise.resolve();
    };

    removeDatabase = () => {
        return Promise.resolve();
    };
}

export default CommonDB;
export { StorageUpdateMessage };
