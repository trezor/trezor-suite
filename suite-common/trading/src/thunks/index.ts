import { confirmTradeThunk } from './buy/confirmTradeThunk';
import { handleRequestThunk as handleBuyRequestThunk } from './buy/handleRequestThunk';
import { loadInfoThunk } from './buy/loadInfoThunk';
import { selectQuoteThunk as selectBuyQuoteThunk } from './buy/selectQuoteThunk';
import { loadInitialDataThunk } from './common/loadInitialDataThunk';
import { verifyAddressThunk } from './common/verifyAddressThunk';
import { handleRequestThunk as handleExchangeRequestThunk } from './exchange/handleRequestThunk';
import { selectQuoteThunk as selectExchangeQuoteThunk } from './exchange/selectQuoteThunk';

export const tradingThunks = {
    verifyAddressThunk,
    loadInitialDataThunk,
};

export const buyThunks = {
    loadInfoThunk,
    handleRequestThunk: handleBuyRequestThunk,
    selectQuoteThunk: selectBuyQuoteThunk,
    confirmTradeThunk,
};

export const exchangeThunks = {
    handleRequestThunk: handleExchangeRequestThunk,
    selectQuoteThunk: selectExchangeQuoteThunk,
};
