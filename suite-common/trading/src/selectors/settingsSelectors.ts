import { TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT } from '../constants';
import { TradingRootState } from '../types';

export const selectTradingMaxSlippagePercentage = (state: TradingRootState) =>
    state.wallet.tradingNew.settings.maxSlippagePercentage ??
    TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT;
