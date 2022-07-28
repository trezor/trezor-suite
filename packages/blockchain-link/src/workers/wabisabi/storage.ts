// https://github.com/WiseLibs/better-sqlite3/blob/HEAD/docs/api.md
// https://github.com/WiseLibs/better-sqlite3/issues/262
import * as DB from 'better-sqlite3';
import type { BlockFilter } from './types';

const FILTER_COLUMNS: (keyof BlockFilter)[] = [
    'blockHeight',
    'blockHash',
    'filter',
    'prevHash',
    'blockTime',
];

export class WabiSabiStorage {
    protected readonly db: DB.Database;
    protected readonly get;
    protected readonly all;
    protected readonly run;

    constructor(path = ':memory:') {
        this.db = new DB(path);
        this.get = <T>(sql: string, ...params: any[]): T => this.db.prepare(sql).get(...params);
        this.all = <T>(sql: string, ...params: any[]): T[] => this.db.prepare(sql).all(...params);
        this.run = (sql: string, ...params: any[]) => this.db.prepare(sql).run(...params);
        this.run(`
            CREATE TABLE IF NOT EXISTS BlockFilters (
                blockHeight INTEGER PRIMARY KEY,
                blockHash TEXT NOT NULL UNIQUE,
                filter TEXT NOT NULL,
                prevHash TEXT NOT NULL,
                blockTime INTEGER NOT NULL
            ) WITHOUT ROWID
        `);
    }

    isConsistent(baseBlockHeight: number, baseBlockHash: string) {
        const { firstFilterHeight, lastFilterHeight, filterCount } = this.get(`
            SELECT
                MIN(blockHeight) AS firstFilterHeight,
                MAX(blockHeight) AS lastFilterHeight,
                COUNT(blockHeight) as filterCount
            FROM BlockFilters
        `);
        if (filterCount === 0) return true; // No stored filter, OK
        if (firstFilterHeight > baseBlockHeight + 1) return false; // Filters missing from the start
        if (lastFilterHeight < baseBlockHeight + 1) return false; // Filters missing at the end
        if (lastFilterHeight - firstFilterHeight + 1 !== filterCount) return false; // Filters missing somewhere inbetween

        const faults = this.all<{ blockHeight: number }>(`
            SELECT A.blockHeight
            FROM BlockFilters A
                LEFT JOIN BlockFilters B
                ON A.blockHeight = B.blockHeight + 1
            WHERE A.prevHash <> B.blockHash
                OR B.blockHash IS NULL
        `);
        if (faults.length !== 1 || faults[0].blockHeight !== firstFilterHeight) return false; // Hash continuity broken

        const firstFilter = this.get<BlockFilter | undefined>(
            `SELECT ${FILTER_COLUMNS}
            FROM BlockFilters
            WHERE blockHeight = (?)`,
            baseBlockHeight + 1,
        );
        if (firstFilter?.prevHash !== baseBlockHash) return false; // Wrong first filter

        return true;
    }

    peekBlockFilter(): BlockFilter | undefined {
        return this.get(`
            SELECT ${FILTER_COLUMNS}
            FROM BlockFilters
            WHERE blockHeight=(
                SELECT MAX(blockHeight)
                FROM BlockFilters
            )
        `);
    }

    // Stupid, without checking, fails on error
    loadBlockFilters(filters: BlockFilter[]) {
        const transaction = this.db.transaction((filters: BlockFilter[]) => {
            const insert = this.db.prepare(`
                INSERT INTO BlockFilters (
                    ${FILTER_COLUMNS}
                ) VALUES (
                    ${FILTER_COLUMNS.map(col => `@${col}`)}
                )
            `);
            filters.forEach(filter => insert.run(filter));
        });
        transaction(filters);
    }

    // Smarter, keeping valid db still valid
    pushBlockFilter(filter: BlockFilter) {
        this.db.transaction((filter: BlockFilter) => {
            const prev = this.get<BlockFilter | undefined>(
                `SELECT blockHash
                FROM BlockFilters
                WHERE blockHeight = (?)`,
                filter.blockHeight - 1,
            );
            if (prev?.blockHash !== filter.prevHash) {
                throw new Error('Previous block filter is missing');
            }
            this.run(
                `DELETE FROM BlockFilters
                WHERE blockHeight >= (?)`,
                filter.blockHeight,
            );
            this.run(
                `INSERT INTO BlockFilters (
                    ${FILTER_COLUMNS}
                ) VALUES (
                    ${FILTER_COLUMNS.map(col => `@${col}`)}
                )`,
                filter,
            );
        })(filter);
    }

    getBlockFilterIterator(): () => IterableIterator<BlockFilter> {
        const stmt = this.db.prepare(
            `SELECT ${FILTER_COLUMNS}
            FROM BlockFilters`,
        );
        return stmt.iterate.bind(stmt);
    }

    dispose() {
        this.db.close();
    }
}
