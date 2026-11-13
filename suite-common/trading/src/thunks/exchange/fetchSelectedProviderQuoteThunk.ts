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
import { type TradingError, type TradingExchangeType } from '../../types';
import { addIdsToQuotes } from '../../utils';
import { exchangeUtils } from '../../utils/exchange/exchangeUtils';
import { getInvityErrorCause } from '../../utils/tradingErrorUtils';

const fetchRejectedValue: TradingError = {
    type: 'error',
    code: 'refresh-transaction-failed',
};

export type FetchSelectedProviderQuoteThunkState = TradingRootState;

export const fetchSelectedProviderQuoteThunk = createThunk<
    ExchangeTrade,
    void,
    { rejectValue: TradingError; state: FetchSelectedProviderQuoteThunkState }
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
        } catch (error) {
            return rejectWithValue({ ...fetchRejectedValue, cause: getInvityErrorCause(error) });
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
