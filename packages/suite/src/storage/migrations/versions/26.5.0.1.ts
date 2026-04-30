import { createMigration } from '@suite/idb-migration-utils';
import { AddressDisplayOptions } from '@suite-common/wallet-types';

import { type SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from '../utils';

type OldSuiteSettingsType = { addressDisplayType?: AddressDisplayOptions };

export default createMigration<SuiteDBSchema>('26.5.0.1', async (db, tx) => {
    const getSuiteSettingsAddressDisplayType = async () => {
        if (!db.objectStoreNames.contains('suiteSettings')) return AddressDisplayOptions.CHUNKED;
        const suiteStore = tx.objectStore('suiteSettings');
        const suite = await suiteStore.get('suite');
        const suiteSettings = suite?.settings as OldSuiteSettingsType | undefined;

        return suiteSettings?.addressDisplayType ?? AddressDisplayOptions.CHUNKED;
    };

    const addressDisplayType = await getSuiteSettingsAddressDisplayType();

    await updateAll(tx, 'walletSettings', walletSettings => ({
        ...walletSettings,
        addressDisplayType,
    }));
});
