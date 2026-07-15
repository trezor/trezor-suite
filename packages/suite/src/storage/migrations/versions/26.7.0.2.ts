import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

const movedSettings = ['testnet-networks', 'nft-section'] as const;

export default createMigration<SuiteDBSchema>('26.7.0.2', async (_db, tx) => {
    const suiteSettingsStore = tx.objectStore('suiteSettings');
    const suiteSettings = await suiteSettingsStore.get('suite');
    const settings = suiteSettings?.settings;

    if (!suiteSettings || !settings?.experimental) return;

    const experimental = settings.experimental as string[];

    settings.isTestnetNetworksEnabled = experimental.includes('testnet-networks');
    settings.isNftSectionEnabled = experimental.includes('nft-section');
    settings.experimental = experimental.filter(
        feature => !movedSettings.some(movedSetting => movedSetting === feature),
    ) as typeof settings.experimental;

    await suiteSettingsStore.put(suiteSettings, 'suite');
});
