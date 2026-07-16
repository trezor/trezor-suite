import { createMigration } from '@suite/idb-migration-utils';

import { type SuiteDBSchema } from 'src/storage/definitions';

import { updateAll } from '../utils';

// Remove inaccurate ERC4626 rates calculated with current share-to-asset ratios.
export default createMigration<SuiteDBSchema>('26.8.0', async (_db, tx) => {
    const accounts = await tx.objectStore('accounts').getAll();

    const erc4626RateKeyPrefixes = accounts.flatMap(account =>
        (account.tokens ?? [])
            .filter(token => token.protocols?.includes('erc4626'))
            .map(token => `${account.symbol}-${token.contract}-`.toLowerCase()),
    );

    if (!erc4626RateKeyPrefixes.length) return;

    await updateAll(tx, 'historicRates', rates => {
        const keysToRemove = Object.keys(rates).filter(fiatRateKey =>
            erc4626RateKeyPrefixes.some(prefix => fiatRateKey.toLowerCase().startsWith(prefix)),
        );

        if (!keysToRemove.length) return;

        keysToRemove.forEach(fiatRateKey => {
            delete rates[fiatRateKey as keyof typeof rates];
        });

        return rates;
    });
});
