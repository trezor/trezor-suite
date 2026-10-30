/**
 * The store's SQLite, as Evolu runs its own: the OPFS database is only reachable from a worker, so
 * this worker owns it and runs the statements the app's store sends, one message at a time.
 */
import {
    Name,
    type SafeSql,
    type SqliteDriver,
    type SqliteQueryParameters,
    createRun,
    getOrThrow,
} from '@evolu/common';
import { installPolyfills } from '@evolu/common/polyfills';
import { createWasmSqliteDriver } from '@evolu/web';

import type { SqlQuery, SqlRow } from '@suite-common/transaction-store';

import type { SqliteWorkerRequest, SqliteWorkerResponse } from './sqliteWorkerProtocol';

const DATABASE_NAME = 'trezor-transaction-store';

const openDriver = async () => {
    installPolyfills();
    await using run = createRun();

    // Persistent in OPFS, in a pool of its own, apart from Evolu's suite-sync database.
    return getOrThrow(await run(createWasmSqliteDriver(Name.orThrow(DATABASE_NAME))));
};

const exec = (driver: SqliteDriver, query: SqlQuery) =>
    driver.exec({
        sql: query.sql as SafeSql,
        // Evolu brands numbers as finite; the store only binds integers and timestamps.
        parameters: query.parameters as SqliteQueryParameters,
    }).rows as SqlRow[];

const execAll = (driver: SqliteDriver, sqls: string[]) =>
    sqls.forEach(sql => exec(driver, { sql, parameters: [] }));

const handle = (driver: SqliteDriver, request: SqliteWorkerRequest): SqlRow[] => {
    switch (request.type) {
        case 'exec':
            return exec(driver, request.query);
        case 'execBatch':
            execAll(driver, ['BEGIN']);
            try {
                request.queries.forEach(query => exec(driver, query));
                execAll(driver, ['COMMIT']);
            } catch (error) {
                execAll(driver, ['ROLLBACK']);
                throw error;
            }

            return [];
        case 'select':
            execAll(driver, ['PRAGMA query_only = 1']);
            try {
                return exec(driver, request.query);
            } finally {
                execAll(driver, ['PRAGMA query_only = 0']);
            }
    }
};

// `null` if the database cannot be opened; every call then fails.
const driverPromise = openDriver().catch(() => null);

self.addEventListener('message', async ({ data }: MessageEvent<SqliteWorkerRequest>) => {
    const driver = await driverPromise;
    let response: SqliteWorkerResponse;
    try {
        if (driver === null) throw new Error('Database unavailable');
        response = { id: data.id, isOk: true, rows: handle(driver, data) };
    } catch {
        response = { id: data.id, isOk: false };
    }
    self.postMessage(response);
});
