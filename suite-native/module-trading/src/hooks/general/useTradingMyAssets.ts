import { useSelector } from 'react-redux';

import { type TradingType } from '@suite-common/trading';
import {
    type CombinedSelectorsRootState,
    selectAccountsWithTokensToSellSectionListByTradingType,
} from '@suite-native/trading-state';

export const useTradingMyAssets = (tradingType: TradingType) =>
    useSelector((state: CombinedSelectorsRootState) =>
        selectAccountsWithTokensToSellSectionListByTradingType(state, tradingType),
    );
