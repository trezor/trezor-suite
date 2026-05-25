import { type IDBPDatabase, type IDBPTransaction, type StoreNames } from 'idb';

import { idbVersionToString } from '@suite/idb-migration-utils';
import SuiteDB, { type OnUpgradeFunc } from '@trezor/suite-storage';

import { reloadApp } from 'src/utils/suite/reload';

import type { SuiteDBSchema } from './definitions';
import { runLegacyMigrations } from './migrations';
import * as migrations from './migrations/versions';

const LAST_LEGACY_VERSION = 57;

/**
 * If number is only 24 bits (lower than lowest 25 bit number), append 8 empty bits at the end (making it a 32 bit number with zero revision number).
 * This is backwards compatibility for versions before 25.11, see suite/idb-migration-utils/MIGRATION.md
 */
const normalizeVersion = (version: number) => (version < 0x01000000 ? version << 8 : version);

const MIGRATIONS = Object.values(migrations)
    .map(m => ({ ...m, threshold: normalizeVersion(m.threshold) }))
    .sort((a, b) => a.threshold - b.threshold);

const LATEST_MIGRATION_VERSION = MIGRATIONS.length
    ? (MIGRATIONS[MIGRATIONS.length - 1]?.threshold ?? 0)
    : 0;

const runMigrations = async (
    db: IDBPDatabase<SuiteDBSchema>,
    currentVersion: number,
    tx: IDBPTransaction<SuiteDBSchema, StoreNames<SuiteDBSchema>[], 'versionchange'>,
) => {
    if (MIGRATIONS.length) {
        console.log(`Current DB version: ${idbVersionToString(currentVersion)}`);

        const normalizedCurrentVersion = normalizeVersion(currentVersion);

        for (const migration of MIGRATIONS) {
            if (normalizedCurrentVersion < migration.threshold) {
                console.log(
                    `Running migration for version ${idbVersionToString(migration.threshold)}`,
                );
                await migration.migrate(db, tx);
            }
        }
    }
};

/**
 *  If the object stores don't already exist then creates them.
 *  Otherwise runs a migration function that transform the data to new scheme version if necessary
 */
const onUpgrade: OnUpgradeFunc<SuiteDBSchema> = async (db, oldVersion, newVersion, transaction) => {
    if (oldVersion > 0 && oldVersion < 13) {
        // just delete whole db as migrations from version older than 13 (internal releases) are not implemented
        try {
            SuiteDB.removeStores(db);
        } catch (err) {
            console.error('Storage: Error during removing all stores', err);
            throw err;
        }
    }

    if (oldVersion < LAST_LEGACY_VERSION) {
        await runLegacyMigrations(db, oldVersion, newVersion, transaction);
    }

    await runMigrations(db, oldVersion, transaction);
};

export const db = new SuiteDB<SuiteDBSchema>(
    'trezor-suite',
    LATEST_MIGRATION_VERSION,
    onUpgrade,
    reloadApp,
);
