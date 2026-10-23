import { type ExchangeTrade } from 'invity-api';

import { createThunk } from '@trezor/redux-utils';

import { TRADING_EXCHANGE_THUNK_PREFIX } from '../../constants';
import { tradingExchangeActions } from '../../reducers/exchangeReducer';
import { type TradingRootState } from '../../reducers/tradingCommonReducer';
import {
    selectTradingExchangeQuotesRequest,
    selectTradingExchangeSelectedQuote,
} from '../../selectors/tradingSelectors';
import { tradeApi } from '../../tradeApi';
import { type TradingExchangeType, type TradingSendRejectedProps } from '../../types';
import { addIdsToQuotes } from '../../utils';
import { exchangeUtils } from '../../utils/exchange/exchangeUtils';

const fetchRejectedValue: TradingSendRejectedProps = {
    type: 'error',
    error: { id: 'TR_TRADING_REFRESH_TRANSACTION_FAILED' },
};

export type FetchSelectedProviderQuoteThunkState = TradingRootState;

export const fetchSelectedProviderQuoteThunk = createThunk<
    ExchangeTrade,
    void,
    { rejectValue: TradingSendRejectedProps; state: FetchSelectedProviderQuoteThunkState }
>(
    `${TRADING_EXCHANGE_THUNK_PREFIX}/fetchSelectedProviderQuote`,
    async (_, { dispatch, getState, rejectWithValue, signal }) => {
        const selectedQuote = selectTradingExchangeSelectedQuote(getState());
        const quotesRequest = selectTradingExchangeQuotesRequest(getState());

        if (!selectedQuote?.exchange || !quotesRequest) {
            return rejectWithValue(fetchRejectedValue);
        }

        let quotes: ExchangeTrade[] | undefined;
        try {
            quotes = await tradeApi.getExchangeQuotes(quotesRequest, signal);
        } catch {
            return rejectWithValue(fetchRejectedValue);
        }

        const successQuotes = addIdsToQuotes<TradingExchangeType>(
            exchangeUtils.getSuccessQuotesOrdered(quotes ?? []),
            'exchange',
        );
        const freshQuote = successQuotes.find(quote => quote.exchange === selectedQuote.exchange);

        if (!freshQuote) {
            return rejectWithValue(fetchRejectedValue);
        }

        dispatch(tradingExchangeActions.saveQuotes(successQuotes));

        return freshQuote;
    },
);
