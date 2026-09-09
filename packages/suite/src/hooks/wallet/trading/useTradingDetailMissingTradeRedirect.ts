import { useEffect } from 'react';

import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { type TradingTransaction, type TradingType } from '@suite-common/trading';

import { getTradingFormRoute } from 'src/views/wallet/trading/common/TradingLayout/tradingPageHeaderUtils';

export const useTradingDetailMissingTradeRedirect = (
    tradeType: TradingType,
    trade: TradingTransaction | undefined,
) => {
    const { dispatch } = useServices(selectDispatch);

    useEffect(() => {
        if (!trade) {
            dispatch(gotoThunk({ routeName: getTradingFormRoute(tradeType) }));
        }
    }, [dispatch, trade, tradeType]);
};
