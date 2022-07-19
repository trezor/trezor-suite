import { StorageBase } from '../../../storage/StorageBase';
import type { BlockFilter } from '../../../types/common';

const BLOCK_FILTER_FIELDS: (keyof BlockFilter)[] = [
    'blockHeight',
    'blockHash',
    'filter',
    'prevHash',
    'blockTime',
];

export class WabiSabiStorage extends StorageBase {
    constructor(path: string) {
        super(path);
        this.db
            .prepare(
                `CREATE TABLE BlockFilters (
                    blockHeight INTEGER PRIMARY KEY,
                    blockHash TEXT NOT NULL,
                    filter TEXT NOT NULL,
                    prevHash TEXT NOT NULL,
                    blockTime INTEGER NOT NULL
                )`,
            )
            .run();
    }

    validate(fromBlock: number) {
        // TODO implement validity check
        const { heightFrom, heightTo, count } = this.db
            .prepare(
                `SELECT
                    MIN(blockHeight) AS heightFrom,
                    MAX(blockHeight) AS heightTo,
                    COUNT(blockHeight) as count
                FROM BlockFilters`,
            )
            .get();
        if (heightFrom !== fromBlock) return false; // Filters missing from the start
        if (heightTo - heightFrom !== count - 1) return false; // Filters missing somewhere inbetween
        // TODO check blockHash<->prevHash continuity?
        return true;
    }

    // Stupid, without checking, fails on error
    loadBlockFilters(filters: BlockFilter[]) {
        const transaction = this.db.transaction((filters: BlockFilter[]) => {
            const insert = this.db.prepare(`
                INSERT INTO BlockFilters (
                    ${BLOCK_FILTER_FIELDS.join(', ')}
                ) VALUES (
                    ${BLOCK_FILTER_FIELDS.map(field => `@${field}`).join(', ')}
                )
            `);
            filters.forEach(filter => insert.run(filter));
        });
        transaction(filters);
    }

    // Should be smart and check if there's any gap, reorg or so
    addBlockFilter(filter: BlockFilter) {
        this.db
            .prepare(
                `INSERT INTO BlockFilters (
                    ${BLOCK_FILTER_FIELDS.join(', ')}
                ) VALUES (
                    ${BLOCK_FILTER_FIELDS.map(field => `@${field}`).join(', ')}
                )`,
            )
            .run(filter);
    }

    getBlockFilter(height: number): BlockFilter {
        return this.db
            .prepare(
                `
                SELECT ${BLOCK_FILTER_FIELDS.join(', ')}
                FROM BlockFilters
                WHERE blockHeight = ${height}
                `,
            )
            .get();
    }

    getAllBlockFilters(): BlockFilter[] {
        return this.db.prepare(`SELECT ${BLOCK_FILTER_FIELDS.join(', ')} FROM BlockFilters`).all();
    }

    getBlockFilterIterator(): () => IterableIterator<BlockFilter> {
        const stmt = this.db.prepare(`SELECT ${BLOCK_FILTER_FIELDS.join(', ')} FROM BlockFilters`);
        return stmt.iterate.bind(stmt);
    }

    dispose() {
        super.dispose();
    }
}
