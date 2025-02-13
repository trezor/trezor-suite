import { handleRequestThunk } from './handleRequestThunk';
import { loadInfoThunk } from './loadInfoThunk';
import { selectQuoteThunk } from './selectQuoteThunk';

export const BUY_THUNK_COMMON_PREFIX = '@trading-buy/thunk';

export const buyThunks = {
    loadInfoThunk,
    handleRequestThunk,
    selectQuoteThunk,
};
