import { getFiatRateKeyFromTicker } from '@suite-common/wallet-utils';
import {
    type ActionTypesDep,
    type ReducersDep,
    createReducerWithExtraDeps,
} from '@trezor/redux-utils';

import { fiatRatesApi } from './fiatRatesApi';
import { type FiatRatesState } from './fiatRatesTypes';

export const fiatRatesInitialState: FiatRatesState = {
    historic: {},
};

type FiatRatesReducerDeps = ActionTypesDep<'storageLoad'> & ReducersDep<'storageLoadHistoricRates'>;

export const prepareFiatRatesReducer = createReducerWithExtraDeps(
    fiatRatesInitialState,
    (builder, extra: FiatRatesReducerDeps) => {
        builder
            // Historic rates are kept outside of the RTK Query cache: they are looked up by
            // a single transaction timestamp across many requests and persisted on desktop.
            .addMatcher(
                fiatRatesApi.endpoints.getHistoricFiatRates.matchFulfilled,
                (state, action) => {
                    const { ticker, baseCurrencyCode } = action.meta.arg.originalArgs;
                    const fiatRateKey = getFiatRateKeyFromTicker(ticker, baseCurrencyCode);

                    state.historic[fiatRateKey] = {
                        ...state.historic[fiatRateKey],
                        ...action.payload,
                    };
                },
            )
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                extra.reducers.storageLoadHistoricRates,
            );
    },
);
