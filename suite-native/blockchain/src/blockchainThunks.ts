import { createThunk } from '@suite-common/redux-utils';
import { type NetworkSymbol, getNetworkOptional } from '@suite-common/wallet-config';
import {
    blockchainActions,
    fetchAndUpdateAccountThunk,
    selectAccountsSymbols,
    selectDeviceAccountsByNetworkSymbol,
    subscribeBlockchainThunk,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

const BLOCKCHAIN_MODULE_PREFIX = '@suite-native/blockchain';

const accountLastFetchTime: Record<AccountKey, number> = {};
const ACCOUNT_LAST_FETCH_TIME_LIMIT_MS = 1000 * 10;

const shouldRefetchAccount = ({
    accountKey,
    refetchLimitMs = ACCOUNT_LAST_FETCH_TIME_LIMIT_MS,
}: {
    accountKey: AccountKey;
    refetchLimitMs?: number;
}) => {
    const lastFetchTime = accountLastFetchTime[accountKey];
    if (!lastFetchTime) return true;

    return Date.now() - lastFetchTime > refetchLimitMs;
};

export const syncAccountsWithBlockchainThunk = createThunk(
    `${BLOCKCHAIN_MODULE_PREFIX}/syncAccountsThunk`,
    async ({ symbol }: { symbol: NetworkSymbol }, { getState, dispatch }) => {
        const accounts = selectDeviceAccountsByNetworkSymbol(getState(), symbol);
        const accountForRefetch = accounts.filter(({ key }) =>
            shouldRefetchAccount({ accountKey: key }),
        );

        const accountPromises = accountForRefetch.map(a =>
            dispatch(fetchAndUpdateAccountThunk({ accountKey: a.key })),
        );
        accountForRefetch.forEach(a => {
            accountLastFetchTime[a.key] = Date.now();
        });

        await Promise.all(accountPromises);

        dispatch(blockchainActions.synced({ symbol }));
    },
);

export const syncAllAccountsWithBlockchainThunk = createThunk(
    `${BLOCKCHAIN_MODULE_PREFIX}/syncAllAccountsThunk`,
    async (_, { getState, dispatch }) => {
        const accountsSymbols = selectAccountsSymbols(getState());

        const accountPromises = accountsSymbols.map(symbol =>
            dispatch(syncAccountsWithBlockchainThunk({ symbol })),
        );

        await Promise.all(accountPromises);
    },
);

export const onBlockchainConnectThunk = createThunk(
    `${BLOCKCHAIN_MODULE_PREFIX}/onBlockchainConnectThunk`,
    async ({ symbol }: { symbol: string }, { dispatch }) => {
        const network = getNetworkOptional(symbol.toLowerCase());
        if (!network) return;

        await dispatch(
            subscribeBlockchainThunk({ symbol: network.symbol, fiatRates: true, onConnect: true }),
        );

        // update accounts for connected network
        await dispatch(syncAccountsWithBlockchainThunk({ symbol: network.symbol }));
        dispatch(blockchainActions.connected(network.symbol));
    },
);
