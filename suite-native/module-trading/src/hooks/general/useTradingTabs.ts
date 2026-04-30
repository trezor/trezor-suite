import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type TradingTypeWithConcierge } from '@suite-common/trading';
import { selectActiveTradingType, tradingActions } from '@suite-native/trading-state';

export const useTradingTabs = () => {
    const dispatch = useDispatch();
    const activeTab = useSelector(selectActiveTradingType);

    const setActiveTab = useCallback(
        (tab: TradingTypeWithConcierge) => {
            dispatch(tradingActions.setActiveTradingType(tab));
        },
        [dispatch],
    );

    return { activeTab, setActiveTab };
};
