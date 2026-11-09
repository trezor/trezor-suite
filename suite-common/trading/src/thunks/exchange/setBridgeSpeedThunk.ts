import { type ExchangeTrade } from 'invity-api';

import { createThunk } from '@trezor/redux-utils';

import { fetchSelectedProviderQuoteThunk } from './fetchSelectedProviderQuoteThunk';
import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { type TradingRootState } from '../../reducers/tradingCommonReducer';
import { selectTradingExchangeQuotesRequest } from '../../selectors/tradingSelectors';
import { type TradingSendRejectedProps } from '../../types';
import { type BridgeSpeed } from '../../types/bridgeSpeed';

const setBridgeSpeedRejectedValue: TradingSendRejectedProps = {
    type: 'error',
    error: { id: 'TR_TRADING_REFRESH_TRANSACTION_FAILED' },
};

export type SetBridgeSpeedThunkProps = {
    bridgeSpeed: BridgeSpeed;
};

export type SetBridgeSpeedThunkState = TradingRootState;

export const setBridgeSpeedThunk = createThunk<
    ExchangeTrade,
    SetBridgeSpeedThunkProps,
    { rejectValue: TradingSendRejectedProps; state: SetBridgeSpeedThunkState }
>(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/setBridgeSpeed`,
    async ({ bridgeSpeed }, { dispatch, getState, rejectWithValue, fulfillWithValue }) => {
        const quotesRequest = selectTradingExchangeQuotesRequest(getState());

        if (!quotesRequest) {
            return rejectWithValue(setBridgeSpeedRejectedValue);
        }

        dispatch(tradingExchangeActions.saveQuoteRequest({ ...quotesRequest, bridgeSpeed }));

        const result = await dispatch(fetchSelectedProviderQuoteThunk());

        if (!fetchSelectedProviderQuoteThunk.fulfilled.match(result)) {
            dispatch(tradingExchangeActions.saveQuoteRequest(quotesRequest));

            return rejectWithValue(setBridgeSpeedRejectedValue);
        }

        // the refreshed quote carries the bridgeSpeed returned by the API
        dispatch(tradingExchangeActions.saveSelectedQuote(result.payload));

        return fulfillWithValue(result.payload);
    },
);
