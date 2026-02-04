import {
    CreateSqliteDriver,
    SqliteDriver,
    SqliteRow,
    createPreparedStatementsCache,
} from '@evolu/common';
// eslint-disable-next-line import/no-extraneous-dependencies
import BetterSQLite, { Statement } from 'better-sqlite3';

export const createSqliteInMemoryDriver: CreateSqliteDriver = () => {
    const db = new BetterSQLite(':memory:');

    let isDisposed = false;

    const cache = createPreparedStatementsCache<Statement>(
        sql => db.prepare(sql),
        // Not needed.
        // https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#class-statement
        () => undefined,
    );

    const driver: SqliteDriver = {
        exec: (query, isMutation) => {
            // Always prepare is recommended for better-sqlite3
            const prepared = cache.get(query, true);
            const rows = isMutation ? [] : (prepared.all(query.parameters) as Array<SqliteRow>);
            const changes = isMutation ? prepared.run(query.parameters).changes : 0;

            return { rows, changes };
        },

        export: () => db.serialize(),

        [Symbol.dispose]: () => {
            if (isDisposed) return;
            isDisposed = true;
            cache[Symbol.dispose]();
            db.close();
        },
    };

    return Promise.resolve(driver);
};
