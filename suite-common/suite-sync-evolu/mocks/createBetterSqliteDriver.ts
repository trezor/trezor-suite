import {
    CreateSqliteDriver,
    SqliteDriver,
    SqliteRow,
    createPreparedStatementsCache,
    lazyVoid,
    ok,
} from '@evolu/common';
import BetterSQLite, { type Statement } from 'better-sqlite3';

// Duplicated from @evolu/nodejs because @evolu/common cannot depend on it
// (nodejs depends on common — importing back would create a circular dependency).
export const createBetterSqliteDriver: CreateSqliteDriver = (name, options) => () => {
    const filename = options?.mode === 'memory' ? ':memory:' : `${name}.db`;
    const db = new BetterSQLite(filename);
    let isDisposed = false;

    const cache = createPreparedStatementsCache<Statement>(
        sql => db.prepare(sql),
        // Not needed.
        // https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#class-statement
        lazyVoid,
    );

    const driver: SqliteDriver = {
        exec: query => {
            // Always prepare is recommended for better-sqlite3
            const prepared = cache.get(query, true);

            if (prepared.reader) {
                const rows = prepared.all(query.parameters) as Array<SqliteRow>;

                return { rows, changes: 0 };
            }

            const { changes } = prepared.run(query.parameters);

            return { rows: [], changes };
        },

        export: () => {
            const file = db.serialize();
            const { buffer } = file;

            if (buffer instanceof ArrayBuffer) {
                return new Uint8Array(buffer, file.byteOffset, file.byteLength);
            }

            // Ensure export uses transferable ArrayBuffer backing.
            return new Uint8Array(file);
        },

        [Symbol.dispose]: () => {
            if (isDisposed) return;
            isDisposed = true;
            cache[Symbol.dispose]();
            db.close();
        },
    };

    return ok(driver);
};
