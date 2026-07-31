import { clearQuotesAndParamsByTradingTypeThunk } from './clearQuotesAndParamsByTradingTypeThunk';
import { createPaymentRequestsThunk } from './createPaymentRequestsThunk';
import { loadInitialDataThunk } from './loadInitialDataThunk';
import { recomposeAndSignTxThunk } from './recomposeAndSignTxThunk';
import { setLastErrorMessageByTradingType } from './setLastErrorMessageByTradingType';
import { verifyAddressThunk } from './verifyAddressThunk';
import { watchTradeThunk } from './watchTradeThunk';

export const tradingThunks = {
    verifyAddressThunk,
    loadInitialDataThunk,
    recomposeAndSignTxThunk,
    watchTradeThunk,
    createPaymentRequestsThunk,
    setLastErrorMessageByTradingType,
    clearQuotesAndParamsByTradingTypeThunk,
};
