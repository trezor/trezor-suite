import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { type TradingTypeWithConcierge } from '@suite-common/trading';
import { selectActiveTradingType, tradingActions } from '@suite-native/trading-state';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const useTradingTabs = () => {
    const { dispatch } = useServices(injectDispatch);
    const activeTab = useSelector(selectActiveTradingType);

    const setActiveTab = useCallback(
        (tab: TradingTypeWithConcierge) => {
            dispatch(tradingActions.setActiveTradingType(tab));
        },
        [dispatch],
    );

    return { activeTab, setActiveTab };
};
