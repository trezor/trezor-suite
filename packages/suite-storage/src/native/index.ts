import {
    IDBPDatabase,
    IDBPTransaction,
    IndexKey,
    IndexNames,
    StoreKey,
    StoreNames,
    StoreValue,
} from 'idb';

export type OnUpgradeFunc<TDBStructure> = (
    db: IDBPDatabase<TDBStructure>,
    oldVersion: number,
    newVersion: number | null,
    transaction: IDBPTransaction<TDBStructure, StoreNames<TDBStructure>[], 'versionchange'>,
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
        onBlocking?: () => void,
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

        // @ts-expect-error
        this.db = null;
        // create global instance of broadcast channel
        this.broadcastChannel = null;

        CommonDB.instance = this;
    }

    static isDBAvailable = () => false;

    isSupported = () => {
        this.supported = false;

        return false;
    };

    isAccessible = (): Promise<boolean> => {
        const isSupported = this.isSupported();

        // if the instance is blocking db upgrade, db connection will be closed
        return Promise.resolve(isSupported && !this.blocking && !this.blocked);
    };

    getDB = (): Promise<IDBPDatabase<TDBStructure>> =>
        // @ts-expect-error
        Promise.resolve();

    addItem = <
        TStoreName extends StoreNames<TDBStructure>,
        TItem extends StoreValue<TDBStructure, TStoreName>,
        TKey extends StoreKey<TDBStructure, TStoreName>,
    >(
        _store: TStoreName,
        _item: TItem,
        _key?: TKey,
        _upsert?: boolean,
    ): Promise<StoreKey<TDBStructure, TStoreName>> =>
        // @ts-expect-error
        Promise.resolve();

    addItems = <
        TStoreName extends StoreNames<TDBStructure>,
        TItem extends StoreValue<TDBStructure, TStoreName>,
    >(
        _store: TStoreName,
        _items: TItem[],
        _upsert?: boolean,
    ) => Promise.resolve();

    getItemByPK = <
        TStoreName extends StoreNames<TDBStructure>,
        TKey extends StoreKey<TDBStructure, TStoreName>,
    >(
        _store: TStoreName,
        _primaryKey: TKey,
    ): Promise<StoreValue<TDBStructure, TStoreName> | undefined> =>
        // @ts-expect-error
        Promise.resolve();

    getItemByIndex = <
        TStoreName extends StoreNames<TDBStructure>,
        TIndexName extends IndexNames<TDBStructure, TStoreName>,
        TKey extends IndexKey<TDBStructure, TStoreName, TIndexName>,
    >(
        _store: TStoreName,
        _indexName: TIndexName,
        _key: TKey,
    ) => Promise.resolve();

    updateItemByIndex = <
        TStoreName extends StoreNames<TDBStructure>,
        TIndexName extends IndexNames<TDBStructure, TStoreName>,
        TKey extends IndexKey<TDBStructure, TStoreName, TIndexName>,
    >(
        _store: TStoreName,
        _indexName: TIndexName,
        _key: TKey,
        _updateObject: { [key: string]: any },
    ) => Promise.resolve();

    removeItemByPK = <
        TStoreName extends StoreNames<TDBStructure>,
        TKey extends StoreKey<TDBStructure, TStoreName>,
    >(
        _store: TStoreName,
        _key: TKey,
    ) => Promise.resolve();

    removeItemByIndex = <
        TStoreName extends StoreNames<TDBStructure>,
        TIndexName extends IndexNames<TDBStructure, TStoreName>,
        TKey extends IndexKey<TDBStructure, TStoreName, TIndexName>,
    >(
        _store: TStoreName,
        _indexName: TIndexName,
        _key: TKey,
    ) => Promise.resolve();

    getItemsExtended = <
        TStoreName extends StoreNames<TDBStructure>,
        TIndexName extends IndexNames<TDBStructure, TStoreName>,
    >(
        _store: TStoreName,
        _indexName?: TIndexName,
        _filters?: { key?: any; offset?: number; count?: number; reverse?: boolean },
    ) => Promise.resolve() as unknown as Promise<StoreValue<TDBStructure, TStoreName>[]>;

    getItemsWithKeys = <TStoreName extends StoreNames<TDBStructure>>(_store: TStoreName) =>
        Promise.resolve() as unknown as Promise<
            {
                key: unknown extends IndexNames<TDBStructure, TStoreName>
                    ? IndexKey<TDBStructure, TStoreName, IndexNames<TDBStructure, TStoreName>>
                    : StoreKey<TDBStructure, TStoreName>;
                value: StoreValue<TDBStructure, TStoreName>;
            }[]
        >;

    clearStores = <TStoreName extends StoreNames<TDBStructure>>(_storeNames?: TStoreName[]) =>
        Promise.resolve();

    static removeStores = <TDBStructure>(_db: IDBPDatabase<TDBStructure>) => Promise.resolve();

    removeDatabase = () => Promise.resolve();
}

export default CommonDB;
