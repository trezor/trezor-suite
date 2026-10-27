import { type UnknownAction, isAnyOf } from '@reduxjs/toolkit';

import {
    type RateTypeWithoutHistoric,
    type TickerId,
    type Timestamp,
    type TokenAddress,
} from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { isNative } from '@trezor/env-utils';
import { createMiddlewareWithExtraDeps } from '@trezor/redux-utils';

import {
    hasPendingFiatRateDemand,
    markFiatRateDemandPending,
    takePendingFiatRateDemand,
} from './fiatRatesDemandRegister';
import {
    fetchFiatRatesThunk,
    updateFiatRatesThunk,
    updateMissingTxFiatRatesThunk,
    updateTxsFiatRatesThunk,
} from './fiatRatesThunks';
import { accountsActions } from '../accounts/accountsActions';
import { blockchainActions } from '../blockchain/blockchainActions';
import { discoveryActions } from '../discovery/discoveryActions';
import { type DiscoveryRootState } from '../discovery/discoveryReducer';
import { selectHasAnyRunningDiscovery } from '../discovery/discoverySelectors';
import { setBaseCurrency } from '../settings/walletSettingsActions';
import {
    type WalletSettingsRootState,
    selectBaseCurrency,
} from '../settings/walletSettingsReducer';
import { transactionsActions } from '../transactions/transactionsActions';
import { fetchAllTransactionsForAccountThunk } from '../transactions/transactionsThunks';

export type FiatRatesMiddlewareState = WalletSettingsRootState & DiscoveryRootState;

type RequestFiatRatesArgs = {
    rateType: RateTypeWithoutHistoric;
    localCurrency: BaseCurrencyCode;
    dispatch: (action: unknown) => unknown;
    getState: () => FiatRatesMiddlewareState;
};

/**
 * During discovery, record demand instead of fetching so account storms collapse into one flush.
 * Outside discovery, fetch immediately.
 */
const requestFiatRates = ({
    rateType,
    localCurrency,
    dispatch,
    getState,
}: RequestFiatRatesArgs) => {
    if (selectHasAnyRunningDiscovery(getState())) {
        markFiatRateDemandPending(rateType, localCurrency);

        return;
    }

    dispatch(fetchFiatRatesThunk({ rateType, localCurrency }));
};

const flushPendingFiatRates = (dispatch: (action: unknown) => unknown) => {
    if (!hasPendingFiatRateDemand()) {
        return;
    }

    for (const { rateType, localCurrency } of takePendingFiatRateDemand()) {
        dispatch(fetchFiatRatesThunk({ rateType, localCurrency }));
    }
};

export const prepareFiatRatesMiddleware = createMiddlewareWithExtraDeps<
    void,
    UnknownAction,
    FiatRatesMiddlewareState
>((action, { dispatch, next, getState }) => {
    next(action); //next must be at the beginning, othervise tickers are not going to be updated and fiat rates wont fetch (the user will have to wait for 1m timeout)

    if (isAnyOf(accountsActions.updateAccount, accountsActions.createAccount)(action)) {
        const localCurrency = selectBaseCurrency(getState());
        requestFiatRates({ rateType: 'current', localCurrency, dispatch, getState });
        if (!isNative()) {
            requestFiatRates({ rateType: 'lastWeek', localCurrency, dispatch, getState });
        }
    }

    if (
        transactionsActions.addTransaction.match(action) &&
        // On mobile we fetch txs fiat rates on demand, for example when user opens tx details
        !isNative()
    ) {
        // fetch historical rates for each added transaction
        const { account, transactions } = action.payload;
        dispatch(
            updateTxsFiatRatesThunk({
                accountKey: account.key,
                txs: transactions,
                baseCurrencyCode: selectBaseCurrency(getState()),
            }),
        );
    }

    if (
        isAnyOf(
            fetchAllTransactionsForAccountThunk.fulfilled,
            fetchAllTransactionsForAccountThunk.rejected,
        )(action) &&
        // On mobile we fetch txs fiat rates on demand, for example when user opens tx details
        !isNative()
    ) {
        // Fiat rates are fetched for transaction when the transaction is added (see above).
        // This is a fallback mechanism for cases when only fiat rates are missing.
        // It is happening in suite-native because it does not have fiat rates persisted.
        // But it can happen on desktop as well if fiat rates fetch fails for whatever reason.
        dispatch(updateMissingTxFiatRatesThunk({ localCurrency: selectBaseCurrency(getState()) }));
    }

    if (setBaseCurrency.match(action)) {
        const { localCurrency } = action.payload;
        // We need to pass localCurrency as a parameter, because it is not yet updated in the store
        requestFiatRates({ rateType: 'current', localCurrency, dispatch, getState });
        if (!isNative()) {
            requestFiatRates({ rateType: 'lastWeek', localCurrency, dispatch, getState });
            if (!selectHasAnyRunningDiscovery(getState())) {
                dispatch(updateMissingTxFiatRatesThunk({ localCurrency }));
            }
        }
    }

    if (blockchainActions.connected.match(action)) {
        const localCurrency = selectBaseCurrency(getState());
        requestFiatRates({ rateType: 'current', localCurrency, dispatch, getState });
        if (!isNative()) {
            requestFiatRates({ rateType: 'lastWeek', localCurrency, dispatch, getState });
        }
    }

    // Fetch fiat rates for all tokens of newly suite-native discovered account.
    // Skip while discovery is active — demand is already registered above and flushed at the end.
    if (accountsActions.createAccount.match(action) && !selectHasAnyRunningDiscovery(getState())) {
        const baseCurrencyCode = selectBaseCurrency(getState());

        const { tokens = [], symbol } = action.payload.account;
        const tokenTickers = tokens.map(token => ({
            symbol,
            tokenAddress: token.contract as TokenAddress,
            protocols: token.protocols,
        })) satisfies TickerId[];
        // include main account fiat rate ticker first so its rate is fetched before tokens
        const tickers = [{ symbol }, ...tokenTickers];

        dispatch(
            updateFiatRatesThunk({
                tickers,
                rateType: 'current',
                baseCurrencyCode,
                fetchAttemptTimestamp: Date.now() as Timestamp,
            }),
        );
    }

    // Flush postponed demand once no discovery remains in progress (covers multi-device).
    if (
        discoveryActions.updateDiscovery.match(action) &&
        !selectHasAnyRunningDiscovery(getState())
    ) {
        flushPendingFiatRates(dispatch);
    }

    return action;
});
