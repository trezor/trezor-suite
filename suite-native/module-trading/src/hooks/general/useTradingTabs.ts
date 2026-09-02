import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useDispatch } from '@suite-common/redux-utils';
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
