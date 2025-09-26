import type { IDBPTransaction, StoreNames } from 'idb';

import type { SuiteDBSchema } from '../../definitions';
import { updateAll } from '../utils';

export async function removeNetwork(
    tx: IDBPTransaction<SuiteDBSchema, StoreNames<SuiteDBSchema>[], 'versionchange'>,
    removedNetworkSymbol: string,
) {
    // remove a network transactions, change token address to contract
    if (tx.objectStoreNames.contains('txs')) {
        await updateAll(tx, 'txs', tx => {
            if (tx.tx.symbol === removedNetworkSymbol) {
                return null;
            }

            tx.tx.tokens.forEach(token => {
                // @ts-expect-error
                token.contract = token.address;
                // @ts-expect-error
                delete token.address;
            });

            return tx;
        });
    }

    // remove a network accounts, change token address to contract
    if (tx.objectStoreNames.contains('accounts')) {
        await updateAll(tx, 'accounts', account => {
            if (account.symbol === removedNetworkSymbol) {
                return null;
            }

            account.tokens?.forEach(token => {
                // @ts-expect-error
                token.contract = token.address;
                // @ts-expect-error
                delete token.address;
            });

            return account;
        });
    }

    // remove a network from coin settings
    if (tx.objectStoreNames.contains('walletSettings')) {
        await updateAll(tx, 'walletSettings', walletSettings => {
            walletSettings.enabledNetworks = walletSettings.enabledNetworks.filter(
                network => network !== removedNetworkSymbol,
            );

            return walletSettings;
        });
    }

    // remove a from backend settings
    if (tx.objectStoreNames.contains('backendSettings')) {
        const backendSettings = tx.objectStore('backendSettings');
        // @ts-expect-error
        await backendSettings.delete(removedNetworkSymbol);
    }
}
