import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    type TradingRootState,
    selectTradingTradeByOrderId,
    tradingThunks,
} from '@suite-common/trading';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

/**
 * Loads the catalogs of the trade's section, because only they have the provider that the trade detail shows.
 */
export const useTradeSectionCatalogs = (orderId: string) => {
    const { dispatch } = useServices(injectDispatch);
    const tradeType = useSelector(
        (state: TradingRootState) => selectTradingTradeByOrderId(state, orderId)?.tradeType,
    );

    useEffect(() => {
        if (tradeType !== undefined) {
            dispatch(tradingThunks.loadInitialDataThunk({ activeSection: tradeType }));
        }
    }, [dispatch, tradeType]);
};
