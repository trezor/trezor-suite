import { confirmTradeThunk } from './buy/confirmTradeThunk';
import { handleRequestThunk as handleBuyRequestThunk } from './buy/handleRequestThunk';
import { loadInfoThunk } from './buy/loadInfoThunk';
import { selectQuoteThunk } from './buy/selectQuoteThunk';
import { loadInitialDataThunk } from './common/loadInitialDataThunk';
import { verifyAddressThunk } from './common/verifyAddressThunk';
import { watchTradeThunk } from './common/watchTradeThunk';
import { handleRequestThunk as handleExchangeRequestThunk } from './exchange/handleRequestThunk';

export { type HandleRequestThunkProps } from './buy/handleRequestThunk';

export const tradingThunks = {
    verifyAddressThunk,
    loadInitialDataThunk,
    watchTradeThunk,
};

export const buyThunks = {
    loadInfoThunk,
    handleRequestThunk: handleBuyRequestThunk,
    selectQuoteThunk,
    confirmTradeThunk,
};

export const exchangeThunks = {
    handleRequestThunk: handleExchangeRequestThunk,
};
