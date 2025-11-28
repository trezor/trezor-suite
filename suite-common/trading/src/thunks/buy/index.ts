import { confirmBuyTradeThunk } from './confirmBuyTradeThunk';
import { handleBuyRequestThunk } from './handleBuyRequestThunk';
import { loadBuyInfoThunk } from './loadBuyInfoThunk';
import { selectBuyQuoteThunk } from './selectBuyQuoteThunk';

export const buyThunks = {
    loadInfoThunk: loadBuyInfoThunk,
    handleRequestThunk: handleBuyRequestThunk,
    selectQuoteThunk: selectBuyQuoteThunk,
    confirmTradeThunk: confirmBuyTradeThunk,
};
