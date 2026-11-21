import { LEGACY_ORIGIN_RECORDS_PER_MESSAGE } from './legacyOriginExportLimits';
import {
    type LegacyOriginIndexDefinition,
    type LegacyOriginObjectStoreDefinition,
    legacyOriginDatabaseDefinition,
    legacyOriginExportFinishedMessage,
    legacyOriginExportObjectStoreMessage,
    legacyOriginFile,
    legacyOriginIndexDefinition,
    legacyOriginKey,
    legacyOriginObjectStoreDefinition,
    legacyOriginStorageImportReport,
} from './messages';

const createIndex = (index: Partial<LegacyOriginIndexDefinition> = {}) => ({
    name: 'txid',
    keyPath: 'tx.txid',
    unique: false,
    multiEntry: false,
    ...index,
});

const createObjectStore = (objectStore: Partial<LegacyOriginObjectStoreDefinition> = {}) => ({
    name: 'txs',
    keyPath: ['tx.deviceState', 'tx.descriptor', 'tx.txid', 'tx.type'],
    autoIncrement: false,
    indexes: [createIndex()],
    ...objectStore,
});

describe('legacyOriginIndexDefinition', () => {
    it.each(['tx.txid', 'order', '', ['tx.descriptor', 'tx.symbol'], ['$id', '_ä']])(
        'accepts the key path %j',
        keyPath => {
            expect(legacyOriginIndexDefinition.safeParse(createIndex({ keyPath })).success).toBe(
                true,
            );
        },
    );

    it.each(['tx..txid', 'tx.', '.tx', '1tx', 'tx-id', 'tx txid', []])(
        'refuses the key path %j',
        keyPath => {
            expect(legacyOriginIndexDefinition.safeParse(createIndex({ keyPath })).success).toBe(
                false,
            );
        },
    );

    it('refuses a multi-entry index with an array key path', () => {
        const index = createIndex({ keyPath: ['tx.txid', 'tx.type'], multiEntry: true });

        expect(legacyOriginIndexDefinition.safeParse(index).success).toBe(false);
    });

    it('refuses unknown properties', () => {
        expect(
            legacyOriginIndexDefinition.safeParse({ ...createIndex(), locale: 'en' }).success,
        ).toBe(false);
    });
});

describe('legacyOriginObjectStoreDefinition', () => {
    it.each([
        ['out-of-line keys', null],
        ['a single key path', 'id'],
    ])('accepts an auto-increment store with %s', (_, keyPath) => {
        const objectStore = createObjectStore({ keyPath, autoIncrement: true });

        expect(legacyOriginObjectStoreDefinition.safeParse(objectStore).success).toBe(true);
    });

    it.each([
        ['an empty key path', ''],
        ['an array key path', ['tx.txid']],
    ])('refuses an auto-increment store with %s', (_, keyPath) => {
        const objectStore = createObjectStore({ keyPath, autoIncrement: true });

        expect(legacyOriginObjectStoreDefinition.safeParse(objectStore).success).toBe(false);
    });

    it('refuses two indexes of the same name', () => {
        const objectStore = createObjectStore({ indexes: [createIndex(), createIndex()] });

        expect(legacyOriginObjectStoreDefinition.safeParse(objectStore).success).toBe(false);
    });
});

describe('legacyOriginDatabaseDefinition', () => {
    it.each([0, -1, 1.5, 2 ** 53, Number.NaN])('refuses the version %d', version => {
        expect(
            legacyOriginDatabaseDefinition.safeParse({ name: 'trezor-suite', version }).success,
        ).toBe(false);
    });

    it('refuses a database without a name', () => {
        expect(legacyOriginDatabaseDefinition.safeParse({ name: '', version: 1 }).success).toBe(
            false,
        );
    });
});

describe('legacyOriginKey', () => {
    it.each([
        ['a number', 1],
        ['infinity', -Infinity],
        ['a string', ''],
        ['a date', new Date(0)],
        ['an array buffer', new ArrayBuffer(2)],
        ['a typed array', new Uint8Array([1, 2])],
        ['an array of keys', ['state', 'xpub', [1, new Date(0)]]],
    ])('accepts %s', (_, key) => {
        expect(legacyOriginKey.safeParse(key).success).toBe(true);
    });

    it.each([
        ['NaN', Number.NaN],
        ['an invalid date', new Date(Number.NaN)],
        ['null', null],
        ['undefined', undefined],
        ['a boolean', true],
        ['an object', { txid: 'tx-1' }],
        ['an array holding an invalid key', ['state', null]],
    ])('refuses %s', (_, key) => {
        expect(legacyOriginKey.safeParse(key).success).toBe(false);
    });
});

describe('legacyOriginExportObjectStoreMessage', () => {
    const createMessage = (recordCount: number) => ({
        database: { name: 'trezor-suite', version: 1 },
        objectStore: createObjectStore({ keyPath: null, indexes: [] }),
        records: Array.from({ length: recordCount }, (_, index) => ({ key: index, value: {} })),
    });

    it('accepts a full slice of records', () => {
        expect(
            legacyOriginExportObjectStoreMessage.safeParse(
                createMessage(LEGACY_ORIGIN_RECORDS_PER_MESSAGE),
            ).success,
        ).toBe(true);
    });

    it('refuses more records than a slice holds', () => {
        expect(
            legacyOriginExportObjectStoreMessage.safeParse(
                createMessage(LEGACY_ORIGIN_RECORDS_PER_MESSAGE + 1),
            ).success,
        ).toBe(false);
    });

    it('refuses a record without a valid key', () => {
        const message = { ...createMessage(0), records: [{ key: { not: 'a key' }, value: {} }] };

        expect(legacyOriginExportObjectStoreMessage.safeParse(message).success).toBe(false);
    });
});

describe('legacyOriginExportFinishedMessage', () => {
    it.each([
        [
            'two databases of the same name',
            [
                { name: 'trezor-suite', version: 1, objectStoreNames: [] },
                { name: 'trezor-suite', version: 2, objectStoreNames: [] },
            ],
        ],
        [
            'two object stores of the same name',
            [{ name: 'trezor-suite', version: 1, objectStoreNames: ['txs', 'txs'] }],
        ],
    ])('refuses %s', (_, databases) => {
        expect(
            legacyOriginExportFinishedMessage.safeParse({ databases, localStorage: {} }).success,
        ).toBe(false);
    });
});

describe('legacyOriginFile', () => {
    const content = new ArrayBuffer(4);

    it('accepts a file in a directory', () => {
        expect(
            legacyOriginFile.safeParse({ path: ['.opfs-sahpool', 'file-1'], content }).success,
        ).toBe(true);
    });

    it.each([[[]], [['']], [['.']], [['..', 'file']], [['dir/file']]])(
        'refuses the path %j',
        path => {
            expect(legacyOriginFile.safeParse({ path, content }).success).toBe(false);
        },
    );

    it('refuses content that is not an array buffer', () => {
        expect(
            legacyOriginFile.safeParse({ path: ['file'], content: new Uint8Array(4) }).success,
        ).toBe(false);
    });
});

describe('legacyOriginStorageImportReport', () => {
    it.each([
        { success: true, isImported: true },
        { success: false, error: 'QuotaExceededError' },
    ])('accepts %j', report => {
        expect(legacyOriginStorageImportReport.safeParse(report).success).toBe(true);
    });

    it.each([
        { success: true },
        { success: true, isImported: true, error: 'mixed' },
        { success: false },
        { success: 'true', isImported: true },
    ])('refuses %j', report => {
        expect(legacyOriginStorageImportReport.safeParse(report).success).toBe(false);
    });
});
