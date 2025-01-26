import type { OnUpgradeFunc } from '@trezor/suite-storage';

import { Trade } from 'src/types/wallet/tradingCommonTypes';

import type { SuiteDBSchema } from '../../definitions';

export const migrationCoinmarketToTrading: OnUpgradeFunc<SuiteDBSchema> = async (
    db,
    _oldVersion,
    _newVersion,
    transaction,
) => {
    const oldStoreName = 'coinmarketTrades';
    const newStoreName = 'tradingTrades';

    // 1. Migration coinmarketTrades to tradingTrades
    // @ts-expect-error - old type
    if (db.objectStoreNames.contains(oldStoreName)) {
        // @ts-expect-error - old type
        const trades = transaction.objectStore(oldStoreName);
        let tradesCursor = await trades.openCursor();

        const newTradesStore = db.createObjectStore(newStoreName, { keyPath: trades.keyPath });

        while (tradesCursor) {
            const trade = tradesCursor.value as Trade;

            await tradesCursor.delete();
            await newTradesStore.add(trade);

            tradesCursor = await tradesCursor.continue();
        }

        // @ts-expect-error - old type
        db.deleteObjectStore(oldStoreName);
    }

    // 2. Update draft keys to trading
    const formDrafts = transaction.objectStore('formDrafts');
    const formDraftsKeys = (await formDrafts.getAllKeys()).filter(key =>
        key.includes('coinmarket'),
    );

    formDraftsKeys.forEach(async key => {
        const draft = await formDrafts.get(key);

        if (draft) {
            formDrafts.add(draft, key.replace('coinmarket', 'trading'));
            formDrafts.delete(key);
        }
    });
};
