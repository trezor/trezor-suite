import { confirmTradeThunk as confirmBuyTradeThunk } from './buy/confirmTradeThunk';
import { handleRequestThunk as handleBuyRequestThunk } from './buy/handleRequestThunk';
import { loadInfoThunk } from './buy/loadInfoThunk';
import { selectQuoteThunk as selectBuyQuoteThunk } from './buy/selectQuoteThunk';
import { loadInitialDataThunk } from './common/loadInitialDataThunk';
import { verifyAddressThunk } from './common/verifyAddressThunk';
import { watchTradeThunk } from './common/watchTradeThunk';
import { confirmTradeThunk as confirmExchangeTradeThunk } from './exchange/confirmTradeThunk';
import { handleRequestThunk as handleExchangeRequestThunk } from './exchange/handleRequestThunk';
import { selectQuoteThunk as selectExchangeQuoteThunk } from './exchange/selectQuoteThunk';

export { type HandleRequestThunkProps } from './buy/handleRequestThunk';

export const tradingThunks = {
    verifyAddressThunk,
    loadInitialDataThunk,
    watchTradeThunk,
};

export const buyThunks = {
    loadInfoThunk,
    handleRequestThunk: handleBuyRequestThunk,
    selectQuoteThunk: selectBuyQuoteThunk,
    confirmTradeThunk: confirmBuyTradeThunk,
};

export const exchangeThunks = {
    handleRequestThunk: handleExchangeRequestThunk,
    selectQuoteThunk: selectExchangeQuoteThunk,
    confirmTradeThunk: confirmExchangeTradeThunk,
};
