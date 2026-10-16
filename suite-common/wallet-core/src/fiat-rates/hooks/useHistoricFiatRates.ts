import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { type DeviceRootState } from '@suite-common/device';
import {
    type NotificationsRootState,
    selectTransactionNotifications,
} from '@suite-common/toast-notifications';
import { type AccountKey, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { createWeakMapSelector, injectDispatch } from '@trezor/redux-utils';
import { isNotNullOrUndefined } from '@trezor/utils';

import { type AccountsRootState } from '../../accounts/accountsReducer';
import { selectAccountByKey, selectDeviceAccounts } from '../../accounts/accountsSelectors';
import {
    type WalletSettingsRootState,
    selectBaseCurrency,
} from '../../settings/walletSettingsReducer';
import { type TransactionsRootState } from '../../transactions/transactionsReducerTypes';
import { selectTransactions } from '../../transactions/transactionsSelectors';
import {
    type HistoricFiatRatesQueryArgs,
    fiatRatesApi,
    getHistoricFiatRatesQueryKey,
} from '../fiatRatesApi';
import { selectHistoricFiatRates } from '../fiatRatesSelectors';
import { type FiatRatesHistoricRootState } from '../fiatRatesTypes';
import { getMissingHistoricFiatRatesQueryArgs } from '../getMissingHistoricFiatRatesQueryArgs';

type HistoricFiatRatesSubscription = { unsubscribe: () => void };

const EMPTY_QUERY_ARGS_LIST: HistoricFiatRatesQueryArgs[] = [];

/**
 * Keeps one subscription per query: only added queries subscribe and only removed ones
 * unsubscribe. Fetched rates are merged into the historic rates and drop out of the missing ones,
 * so every query is fetched once.
 */
const useHistoricFiatRatesQueries = (queryArgsList: readonly HistoricFiatRatesQueryArgs[]) => {
    const { dispatch } = useServices(injectDispatch);
    const subscriptionsRef = useRef(new Map<string, HistoricFiatRatesSubscription>());

    useEffect(() => {
        const subscriptions = subscriptionsRef.current;
        const queryArgsBySubscriptionKey = new Map(
            queryArgsList.map(queryArgs => [getHistoricFiatRatesQueryKey(queryArgs), queryArgs]),
        );

        subscriptions.forEach((subscription, subscriptionKey) => {
            if (!queryArgsBySubscriptionKey.has(subscriptionKey)) {
                subscription.unsubscribe();
                subscriptions.delete(subscriptionKey);
            }
        });

        queryArgsBySubscriptionKey.forEach((queryArgs, subscriptionKey) => {
            if (subscriptions.has(subscriptionKey)) return;

            subscriptions.set(
                subscriptionKey,
                dispatch(fiatRatesApi.endpoints.getHistoricFiatRates.initiate(queryArgs)),
            );
        });
    }, [dispatch, queryArgsList]);

    useEffect(() => {
        const subscriptions = subscriptionsRef.current;

        return () => {
            subscriptions.forEach(subscription => subscription.unsubscribe());
            subscriptions.clear();
        };
    }, []);
};

type UseHistoricFiatRatesParams = {
    accountKey: AccountKey | undefined;
    transactions: readonly WalletAccountTransaction[];
    isDisabled?: boolean;
};

/**
 * Fetches the historic rates missing for the given transactions of an account. Read the values with
 * `selectHistoricFiatRatesByTimestamp`.
 */
export const useHistoricFiatRates = ({
    accountKey,
    transactions,
    isDisabled = false,
}: UseHistoricFiatRatesParams) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const historicFiatRates = useSelector(selectHistoricFiatRates);
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const queryArgsList = useMemo(
        () =>
            account && !isDisabled
                ? getMissingHistoricFiatRatesQueryArgs({
                      account,
                      transactions,
                      historicFiatRates,
                      baseCurrencyCode,
                  })
                : EMPTY_QUERY_ARGS_LIST,
        [account, transactions, historicFiatRates, baseCurrencyCode, isDisabled],
    );

    useHistoricFiatRatesQueries(queryArgsList);
};

type SelectNotifiedTransactionsMissingHistoricFiatRatesState = AccountsRootState &
    DeviceRootState &
    FiatRatesHistoricRootState &
    NotificationsRootState &
    TransactionsRootState &
    WalletSettingsRootState;

const createNotificationsSelector =
    createWeakMapSelector.withTypes<SelectNotifiedTransactionsMissingHistoricFiatRatesState>();

const selectNotifiedTransactionsMissingHistoricFiatRatesQueryArgs = createNotificationsSelector(
    [
        selectDeviceAccounts,
        selectTransactions,
        selectTransactionNotifications,
        selectHistoricFiatRates,
        selectBaseCurrency,
    ],
    (deviceAccounts, transactions, notifications, historicFiatRates, baseCurrencyCode) =>
        deviceAccounts.flatMap(account => {
            const notifiedTxids = new Set(
                notifications
                    .filter(
                        notification =>
                            notification.descriptor === account.descriptor &&
                            notification.symbol === account.symbol,
                    )
                    .map(notification => notification.txid),
            );
            if (notifiedTxids.size === 0) return [];

            const notifiedTransactions = (transactions[account.key] ?? [])
                .filter(isNotNullOrUndefined)
                .filter(transaction => notifiedTxids.has(transaction.txid));

            return getMissingHistoricFiatRatesQueryArgs({
                account,
                transactions: notifiedTransactions,
                historicFiatRates,
                baseCurrencyCode,
            });
        }),
);

/**
 * Fetches the historic rates missing for the transactions in notifications, which the dust phishing
 * filter of the notifications needs.
 */
export const useNotifiedTransactionsHistoricFiatRates = () => {
    const queryArgsList = useSelector(selectNotifiedTransactionsMissingHistoricFiatRatesQueryArgs);

    useHistoricFiatRatesQueries(queryArgsList);
};
