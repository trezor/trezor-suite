import { confirmBuyTradeThunk } from './buy/confirmBuyTradeThunk';
import { handleBuyRequestThunk } from './buy/handleBuyRequestThunk';
import { loadBuyInfoThunk } from './buy/loadBuyInfoThunk';
import { selectBuyQuoteThunk } from './buy/selectBuyQuoteThunk';
import { loadInitialDataThunk } from './common/loadInitialDataThunk';
import { recomposeAndSignTxThunk } from './common/recomposeAndSignTxThunk';
import { verifyAddressThunk } from './common/verifyAddressThunk';
import { watchTradeThunk } from './common/watchTradeThunk';
import { confirmExchangeTradeThunk } from './exchange/confirmExchangeTradeThunk';
import { handleExchangeRequestThunk } from './exchange/handleExchangeRequestThunk';
import { loadExchangeInfoThunk } from './exchange/loadExchangeInfoThunk';
import { selectExchangeQuoteThunk } from './exchange/selectExchangeQuoteThunk';
import { sendDexTransactionThunk } from './exchange/sendDexTransactionThunk';
import { sendTransactionThunk } from './exchange/sendTransactionThunk';
import { signDataAndConfirmThunk } from './exchange/signDataAndConfirmThunk';
import { watchTradeApprovalThunk } from './exchange/watchTradeApprovalThunk';
import { confirmSellTradeThunk } from './sell/confirmSellTradeThunk';
import { handleSellRequestThunk } from './sell/handleSellRequestThunk';
import { handleSellTradeThunk } from './sell/handleSellTradeThunk';
import { loadSellInfoThunk } from './sell/loadSellInfoThunk';
import { selectSellQuoteThunk } from './sell/selectSellQuoteThunk';
import { sendSellTransactionThunk } from './sell/sendSellTransactionThunk';

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
    watchTradeApprovalThunk,
};

export const sellThunks = {
    loadInfoThunk: loadSellInfoThunk,
    handleRequestThunk: handleSellRequestThunk,
    handleTradeThunk: handleSellTradeThunk,
    sendTransactionThunk: sendSellTransactionThunk,
    selectQuoteThunk: selectSellQuoteThunk,
    confirmTradeThunk: confirmSellTradeThunk,
};
