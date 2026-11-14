import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    TRADING_SECTION_CATALOGS,
    type TradingRootState,
    selectTradingTradeByOrderId,
    tradingThunks,
} from '@suite-common/trading';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

/**
 * Loads the catalogs of the trade's section, because only they have the provider that the trade detail shows.
 * It keeps the active section and API key of the trading tab below the detail, which stays mounted.
 */
export const useTradeSectionCatalogs = (orderId: string) => {
    const { dispatch } = useServices(injectDispatch);
    const tradeType = useSelector(
        (state: TradingRootState) => selectTradingTradeByOrderId(state, orderId)?.tradeType,
    );

    useEffect(() => {
        if (tradeType !== undefined) {
            dispatch(
                tradingThunks.loadTradingCatalogsThunk({
                    catalogs: TRADING_SECTION_CATALOGS[tradeType],
                }),
            );
        }
    }, [dispatch, tradeType]);
};
