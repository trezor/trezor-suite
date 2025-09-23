import { createMigration } from '@suite/idb-migration-utils';

import { SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from '../utils';

type OldSuiteSettingsType = { autoEject?: boolean };
type OldWalletSettingsType = { autoForgetDeviceData?: boolean };

export default createMigration<SuiteDBSchema>('25.11.0', async (db, tx) => {
    const getSuiteSettings = async () => {
        if (!db.objectStoreNames.contains('suiteSettings')) return undefined;
        const suiteStore = tx.objectStore('suiteSettings');
        const suite = await suiteStore.get('suite');

        return suite?.settings as OldSuiteSettingsType | undefined;
    };

    const getWalletSettings = async () => {
        if (!db.objectStoreNames.contains('walletSettings')) return undefined;
        const walletSettingsStore = tx.objectStore('walletSettings');
        const wallet = await walletSettingsStore.get('wallet');

        return wallet as OldWalletSettingsType | undefined;
    };

    const suiteSettings = await getSuiteSettings();
    const prevAutoEjectValue = suiteSettings?.autoEject === true;
    const walletSettings = await getWalletSettings();
    const prevAutoForgetValue = walletSettings?.autoForgetDeviceData === true;

    await updateAll(tx, 'walletSettings', walletSettings => {
        delete (walletSettings as OldWalletSettingsType).autoForgetDeviceData;

        return {
            ...walletSettings,
            isAutoEjectEnabled: prevAutoEjectValue,
            isAutoForgetDeviceDataEnabled: prevAutoForgetValue,
        };
    });
});
