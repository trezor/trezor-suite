import { confirmSellTradeThunk } from './confirmSellTradeThunk';
import { handleSellRequestThunk } from './handleSellRequestThunk';
import { handleSellTradeThunk } from './handleSellTradeThunk';
import { loadSellInfoThunk } from './loadSellInfoThunk';
import { selectSellQuoteThunk } from './selectSellQuoteThunk';
import { sendSellTransactionThunk } from './sendSellTransactionThunk';

export const sellThunks = {
    loadInfoThunk: loadSellInfoThunk,
    handleRequestThunk: handleSellRequestThunk,
    handleTradeThunk: handleSellTradeThunk,
    sendTransactionThunk: sendSellTransactionThunk,
    selectQuoteThunk: selectSellQuoteThunk,
    confirmTradeThunk: confirmSellTradeThunk,
};
