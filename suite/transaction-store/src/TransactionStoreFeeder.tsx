import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import type { TransactionStoreAccount } from '@suite-common/transaction-store';
import {
    selectAccounts,
    selectBlockchainState,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import type { CustomBackend } from '@suite-common/wallet-types';
import { getCustomBackends, getDefaultBackendType } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';

import { injectGetTransactionStoreService } from './createTransactionStoreService';
import { useTransactionStoreInvalidation } from './transactionStoreQueries';

/**
 * Keeps the store's worker told what the app knows: the accounts, the enabled networks and their
 * backends. Mounted while the store is on; unmounting disposes it and ends the worker.
 */
export const TransactionStoreFeeder = () => {
    const { getTransactionStoreService } = useServices(injectGetTransactionStoreService);
    const accounts = useSelector(selectAccounts);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const blockchain = useSelector(selectBlockchainState);
    const registeredAccountKeys = useRef(new Set<string>());

    useTransactionStoreInvalidation();

    useEffect(
        () => () => {
            void getTransactionStoreService().dispose();
            registeredAccountKeys.current = new Set();
        },
        [getTransactionStoreService],
    );

    const storeAccounts = useMemo(
        () =>
            accounts
                .filter(
                    account =>
                        account.visible &&
                        // Coinjoin accounts are synced by their own backend, not blockchain-link.
                        account.backendType !== 'coinjoin' &&
                        enabledNetworks.includes(account.symbol),
                )
                .map((account): TransactionStoreAccount => ({
                    accountKey: account.key,
                    symbol: account.symbol,
                    descriptor: account.descriptor,
                })),
        [accounts, enabledNetworks],
    );

    useEffect(() => {
        const { transactionStore } = getTransactionStoreService();
        const accountKeys = new Set(storeAccounts.map(({ accountKey }) => accountKey));
        // Only accounts seen leaving in this session; at startup the app has none loaded yet.
        const removedAccountKeys = [...registeredAccountKeys.current].filter(
            accountKey => !accountKeys.has(accountKey),
        );
        registeredAccountKeys.current = accountKeys;

        if (removedAccountKeys.length > 0) {
            void transactionStore.removeAccounts(removedAccountKeys);
        }
        void transactionStore.registerAccounts(storeAccounts);
    }, [getTransactionStoreService, storeAccounts]);

    // The blockchain state changes on every block; only the backends matter here.
    const backendsKey = JSON.stringify(
        enabledNetworks.map(
            (symbol): CustomBackend =>
                getCustomBackends(blockchain, [symbol])[0] ?? {
                    symbol,
                    type: getDefaultBackendType(symbol),
                    urls: [],
                },
        ),
    );

    useEffect(() => {
        const service = getTransactionStoreService();
        const backends: CustomBackend[] = JSON.parse(backendsKey);

        // Backends first, so the networks subscribe to blocks on them right away.
        void service
            .setBackends(backends)
            .then(() =>
                service.transactionStore.watchNetworks(backends.map(({ symbol }) => symbol)),
            );
    }, [getTransactionStoreService, backendsKey]);

    return null;
};
