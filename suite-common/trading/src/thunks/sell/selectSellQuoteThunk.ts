import { type SellFiatTrade } from 'invity-api';

import { createThunk } from '@suite-common/redux-utils';

import { TRADING_SELL_THUNK_PREFIX } from '../../constants';
import { tradingSellActions } from '../../reducers/sellReducer';
import { type TradingRootState, tradingActions } from '../../reducers/tradingCommonReducer';
import {
    selectTradingSellInfo,
    selectTradingSellQuotesRequest,
} from '../../selectors/tradingSelectors';

export type SelectSellQuoteThunkProps = {
    quote: SellFiatTrade;
    nextStep: () => void;
};

type SelectSellQuoteThunkState = TradingRootState;

export const selectSellQuoteThunk = createThunk<
    void,
    SelectSellQuoteThunkProps,
    { state: SelectSellQuoteThunkState }
>(`${TRADING_SELL_THUNK_PREFIX}/selectQuote`, ({ quote, nextStep }, { dispatch, getState }) => {
    const sellInfo = selectTradingSellInfo(getState());
    const quotesRequest = selectTradingSellQuotesRequest(getState());
    const provider = quote.exchange ? sellInfo?.providerInfos[quote.exchange] : undefined;

    if (!quotesRequest || !provider || !quote.cryptoCurrency) return;

    dispatch(tradingSellActions.saveSelectedQuote(quote));
    dispatch(tradingActions.stopRefetchQuotes());
    nextStep();
});
