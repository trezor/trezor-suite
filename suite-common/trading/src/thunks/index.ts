import { confirmTradeThunk } from './buy/confirmTradeThunk';
import { handleRequestThunk } from './buy/handleRequestThunk';
import { loadInfoThunk } from './buy/loadInfoThunk';
import { selectQuoteThunk } from './buy/selectQuoteThunk';
import { verifyAddressThunk } from './common/verifyAddressThunk';

export const tradingThunks = {
    verifyAddressThunk,
};

export const buyThunks = {
    loadInfoThunk,
    handleRequestThunk,
    selectQuoteThunk,
    confirmTradeThunk,
};
