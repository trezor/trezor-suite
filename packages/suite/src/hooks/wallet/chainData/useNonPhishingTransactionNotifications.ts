import { useMemo } from 'react';

import { selectIsQueryChainDataEnabled } from '@suite/flags';
import { getCachedChainTransaction, useSelectedChainNetworks } from '@suite-common/chain-data';
import { useQueryClient } from '@suite-common/react-query';
import { selectTransactionNotifications } from '@suite-common/toast-notifications';
import { isPhishingTransaction, selectTokenDefinitions } from '@suite-common/token-definitions';
import {
    selectActiveDustPhishingThreshold,
    selectDeviceAccounts,
    selectHasUnseenNonPhishingTransactionNotifications,
    selectHistoricFiatRates,
    selectNonPhishingTransactionNotifications,
    selectPhishingTransactions,
    selectTransactions,
} from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';

import { enhanceChainTransactions } from './useAccountTransactionsSource';

/**
 * Transaction notifications without the ones about phishing transactions. With the
 * `queryChainData` flag on, the transactions come from the loaded histories first; transactions the
 * wallet just sent, and histories not loaded yet, are still read from the store.
 */
export const useNonPhishingTransactionNotifications = () => {
    const isQueryChainDataEnabled = useSelector(selectIsQueryChainDataEnabled);
    const storeNotifications = useSelector(selectNonPhishingTransactionNotifications);
    const storeHasUnseen = useSelector(selectHasUnseenNonPhishingTransactionNotifications);

    const queryClient = useQueryClient();
    const networks = useSelectedChainNetworks();
    const notifications = useSelector(selectTransactionNotifications);
    const deviceAccounts = useSelector(selectDeviceAccounts);
    const storedTransactions = useSelector(selectTransactions);
    const phishingMap = useSelector(selectPhishingTransactions);
    const historicRates = useSelector(selectHistoricFiatRates);
    const tokenDefinitions = useSelector(selectTokenDefinitions);
    const dustThreshold = useSelector(selectActiveDustPhishingThreshold);

    const queryNotifications = useMemo(() => {
        if (!isQueryChainDataEnabled) return [];

        return notifications.filter(notification => {
            const account = deviceAccounts.find(
                candidate =>
                    candidate.descriptor === notification.descriptor &&
                    candidate.symbol === notification.symbol,
            );
            if (!account) return true;

            const network = networks.find(({ symbol }) => symbol === account.symbol);
            const loaded = network
                ? getCachedChainTransaction(
                      queryClient,
                      {
                          symbol: account.symbol,
                          backendType: network.backendType,
                          descriptor: account.descriptor,
                      },
                      notification.txid,
                  )
                : undefined;
            const transaction = loaded
                ? enhanceChainTransactions([loaded], account, account.addresses)[0]
                : storedTransactions[account.key]?.find(
                      stored => stored?.txid === notification.txid,
                  );
            if (!transaction) return true;

            return !isPhishingTransaction({
                transaction,
                tokenDefinitions: tokenDefinitions?.[transaction.symbol],
                historicRates,
                txsMarkedAsNotScam: phishingMap[account.key] ?? [],
                dustThreshold,
            }).isPhishing;
        });
    }, [
        isQueryChainDataEnabled,
        notifications,
        deviceAccounts,
        networks,
        queryClient,
        storedTransactions,
        tokenDefinitions,
        historicRates,
        phishingMap,
        dustThreshold,
    ]);

    return isQueryChainDataEnabled
        ? {
              notifications: queryNotifications,
              hasUnseen: queryNotifications.some(notification => !notification.seen),
          }
        : { notifications: storeNotifications, hasUnseen: storeHasUnseen };
};
