import type { IDBPTransaction, StoreNames } from 'idb';

import type { SuiteDBSchema } from '../../definitions';
import { updateAll } from '../utils';

export async function removePersistedNetworkData(
    tx: IDBPTransaction<SuiteDBSchema, StoreNames<SuiteDBSchema>[], 'versionchange'>,
    removedNetworkSymbol: string,
) {
    if (tx.objectStoreNames.contains('txs')) {
        await updateAll(tx, 'txs', tx => {
            if (tx.tx.symbol === removedNetworkSymbol) {
                return null;
            }

            return tx;
        });
    }

    if (tx.objectStoreNames.contains('accounts')) {
        await updateAll(tx, 'accounts', account => {
            if (account.symbol === removedNetworkSymbol) {
                return null;
            }

            return account;
        });
    }

    if (tx.objectStoreNames.contains('backendSettings')) {
        const backendSettings = tx.objectStore('backendSettings');
        // @ts-expect-error
        await backendSettings.delete(removedNetworkSymbol);
    }
}

export async function removeNetwork(
    tx: IDBPTransaction<SuiteDBSchema, StoreNames<SuiteDBSchema>[], 'versionchange'>,
    removedNetworkSymbol: string,
) {
    await removePersistedNetworkData(tx, removedNetworkSymbol);

    if (tx.objectStoreNames.contains('walletSettings')) {
        await updateAll(tx, 'walletSettings', walletSettings => {
            walletSettings.enabledNetworks = walletSettings.enabledNetworks.filter(
                network => network !== removedNetworkSymbol,
            );

            return walletSettings;
        });
    }
}
