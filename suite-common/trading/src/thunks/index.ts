import { TRADING_BUY_PREFIX, TRADING_PREFIX } from '../constants';
import { confirmTradeThunk } from './buy/confirmTradeThunk';
import { handleRequestThunk } from './buy/handleRequestThunk';
import { loadInfoThunk } from './buy/loadInfoThunk';
import { selectQuoteThunk } from './buy/selectQuoteThunk';
import { verifyAddressThunk } from './common/verifyAddressThunk';

export const TRADING_THUNK_COMMON_PREFIX = `${TRADING_PREFIX}/thunk`;
export const BUY_THUNK_COMMON_PREFIX = `${TRADING_BUY_PREFIX}/thunk`;

export const tradingThunks = {
    verifyAddressThunk,
};

export const buyThunks = {
    loadInfoThunk,
    handleRequestThunk,
    selectQuoteThunk,
    confirmTradeThunk,
};
