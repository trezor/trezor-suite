import { TradingRootState } from '../tradingSlice';

export const selectTradingEnvironment = (state: TradingRootState) =>
    state.wallet.tradingNew.tradingEnvironment;
