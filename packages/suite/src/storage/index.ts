import SuiteDB, { OnUpgradeFunc } from '@trezor/suite-storage';
import { desktopApi } from '@trezor/suite-desktop-api';
import { migrate } from './migrations';

import type { SuiteDBSchema } from './definitions';

const VERSION = 31; // don't forget to add migration and CHANGELOG when changing versions!

/**
 *  If the object stores don't already exist then creates them.
 *  Otherwise runs a migration function that transform the data to new scheme version if necessary
 */
const onUpgrade: OnUpgradeFunc<SuiteDBSchema> = async (db, oldVersion, newVersion, transaction) => {
    if (oldVersion > 0 && oldVersion < 13) {
        // just delete whole db as migrations from version older than 13 (internal releases) are not implemented
        try {
            await SuiteDB.removeStores(db);
        } catch (err) {
            console.error('Storage: Error during removing all stores', err);
            throw err;
        }
    }

    // migrate functions
    await migrate(db, oldVersion, newVersion, transaction);
};

const onDowngrade = () => {
    if (desktopApi.available) {
        desktopApi.appRestart();
    } else if (typeof window !== 'undefined') {
        window.location.reload();
    }
};

export const db = new SuiteDB<SuiteDBSchema>('trezor-suite', VERSION, onUpgrade, onDowngrade);
