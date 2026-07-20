import { type TradingType, selectSelectedTradingAsset } from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';

export const useSelectedTradingAsset = (tradingType: TradingType) =>
    useSelector(state => selectSelectedTradingAsset(state, tradingType));
