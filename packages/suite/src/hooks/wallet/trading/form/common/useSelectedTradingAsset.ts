import { useSelector } from '@suite-common/redux-utils';
import { type TradingType, selectSelectedTradingAsset } from '@suite-common/trading';
export const useSelectedTradingAsset = (tradingType: TradingType) =>
    useSelector(state => selectSelectedTradingAsset(state, tradingType));
