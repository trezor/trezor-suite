import { confirmTradeThunk } from './confirmTradeThunk';
import { handleRequestThunk } from './handleRequestThunk';
import { loadInfoThunk } from './loadInfoThunk';
import { selectQuoteThunk } from './selectQuoteThunk';

export const buyThunks = {
    loadInfoThunk,
    handleRequestThunk,
    selectQuoteThunk,
    confirmTradeThunk,
};
