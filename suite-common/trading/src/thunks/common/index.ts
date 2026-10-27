import { clearQuotesAndParamsByTradingTypeThunk } from './clearQuotesAndParamsByTradingTypeThunk';
import { createPaymentRequestsThunk } from './createPaymentRequestsThunk';
import { ensureTradeApiDeviceSaltThunk } from './ensureTradeApiDeviceSaltThunk';
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
    ensureTradeApiDeviceSaltThunk: typeof ensureTradeApiDeviceSaltThunk;
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
    ensureTradeApiDeviceSaltThunk,
    setTradeApiKeyThunk,
};
