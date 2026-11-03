import { clearQuotesAndParamsByTradingTypeThunk } from './clearQuotesAndParamsByTradingTypeThunk';
import { createPaymentRequestsThunk } from './createPaymentRequestsThunk';
import { loadInitialDataThunk } from './loadInitialDataThunk';
import { recomposeAndSignTxThunk } from './recomposeAndSignTxThunk';
import { setLastErrorMessageByTradingTypeThunk } from './setLastErrorMessageByTradingType';
import { setTradeApiKeyThunk } from './setTradeApiKeyThunk';
import { verifyAddressThunk } from './verifyAddressThunk';
import { watchTradeThunk } from './watchTradeThunk';

type TradingThunks = {
    verifyAddressThunk: typeof verifyAddressThunk;
    loadInitialDataThunk: typeof loadInitialDataThunk;
    recomposeAndSignTxThunk: typeof recomposeAndSignTxThunk;
    watchTradeThunk: typeof watchTradeThunk;
    createPaymentRequestsThunk: typeof createPaymentRequestsThunk;
    setLastErrorMessageByTradingTypeThunk: typeof setLastErrorMessageByTradingTypeThunk;
    clearQuotesAndParamsByTradingTypeThunk: typeof clearQuotesAndParamsByTradingTypeThunk;
    setTradeApiKeyThunk: typeof setTradeApiKeyThunk;
};

export const tradingThunks: TradingThunks = {
    verifyAddressThunk,
    loadInitialDataThunk,
    recomposeAndSignTxThunk,
    watchTradeThunk,
    createPaymentRequestsThunk,
    setLastErrorMessageByTradingTypeThunk,
    clearQuotesAndParamsByTradingTypeThunk,
    setTradeApiKeyThunk,
};
