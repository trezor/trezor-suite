import { clearQuotesAndParamsByTradingTypeThunk } from './clearQuotesAndParamsByTradingTypeThunk';
import { createPaymentRequestsThunk } from './createPaymentRequestsThunk';
import { loadAssetCatalogThunk } from './loadAssetCatalogThunk';
import { loadInitialDataThunk } from './loadInitialDataThunk';
import { recomposeAndSignTxThunk } from './recomposeAndSignTxThunk';
import { setLastErrorMessageByTradingTypeThunk } from './setLastErrorMessageByTradingType';
import { verifyAddressThunk } from './verifyAddressThunk';
import { watchTradeThunk } from './watchTradeThunk';

export const tradingThunks = {
    verifyAddressThunk,
    loadInitialDataThunk,
    loadAssetCatalogThunk,
    recomposeAndSignTxThunk,
    watchTradeThunk,
    createPaymentRequestsThunk,
    setLastErrorMessageByTradingTypeThunk,
    clearQuotesAndParamsByTradingTypeThunk,
};
