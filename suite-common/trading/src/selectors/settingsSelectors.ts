import { TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT } from '../constants';
import type { TradingRootState } from '../reducers/tradingCommonReducer';

export const selectTradingMaxSlippagePercentage = (state: TradingRootState) =>
    state.wallet.trading.settings.maxSlippagePercentage ??
    TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT;
