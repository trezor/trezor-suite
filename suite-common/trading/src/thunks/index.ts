import { confirmTradeThunk as confirmBuyTradeThunk } from './buy/confirmTradeThunk';
import { handleRequestThunk as handleBuyRequestThunk } from './buy/handleRequestThunk';
import { loadInfoThunk as loadBuyInfoThunk } from './buy/loadInfoThunk';
import { selectQuoteThunk as selectBuyQuoteThunk } from './buy/selectQuoteThunk';
import { loadInitialDataThunk } from './common/loadInitialDataThunk';
import { recomposeAndSignTxThunk } from './common/recomposeAndSignTxThunk';
import { verifyAddressThunk } from './common/verifyAddressThunk';
import { watchTradeThunk } from './common/watchTradeThunk';
import { confirmTradeThunk as confirmExchangeTradeThunk } from './exchange/confirmTradeThunk';
import { handleRequestThunk as handleExchangeRequestThunk } from './exchange/handleRequestThunk';
import { loadInfoThunk as loadExchangeInfoThunk } from './exchange/loadInfoThunk';
import { selectQuoteThunk as selectExchangeQuoteThunk } from './exchange/selectQuoteThunk';
import { sendDexTransactionThunk } from './exchange/sendDexTransactionThunk';
import { sendTransactionThunk } from './exchange/sendTransactionThunk';
import { signDataAndConfirmThunk } from './exchange/signDataAndConfirmThunk';
import { handleSellRequestThunk } from './sell/handleSellRequestThunk';
import { loadSellInfoThunk } from './sell/loadSellInfoThunk';

export { type HandleRequestThunkProps } from './buy/handleRequestThunk';

export const tradingThunks = {
    verifyAddressThunk,
    loadInitialDataThunk,
    recomposeAndSignTxThunk,
    watchTradeThunk,
};

export const buyThunks = {
    loadInfoThunk: loadBuyInfoThunk,
    handleRequestThunk: handleBuyRequestThunk,
    selectQuoteThunk: selectBuyQuoteThunk,
    confirmTradeThunk: confirmBuyTradeThunk,
};

export const exchangeThunks = {
    loadInfoThunk: loadExchangeInfoThunk,
    handleRequestThunk: handleExchangeRequestThunk,
    selectQuoteThunk: selectExchangeQuoteThunk,
    confirmTradeThunk: confirmExchangeTradeThunk,
    signDataAndConfirmThunk,
    sendDexTransactionThunk,
    sendTransactionThunk,
};

export const sellThunks = {
    loadInfoThunk: loadSellInfoThunk,
    handleRequestThunk: handleSellRequestThunk,
};
