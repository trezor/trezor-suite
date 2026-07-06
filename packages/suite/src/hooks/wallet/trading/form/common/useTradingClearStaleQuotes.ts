import { useEffect } from 'react';

import {
    type TradingType,
    selectTradingQuotesByType,
    tradingBuyActions,
    tradingExchangeActions,
    tradingSellActions,
} from '@suite-common/trading';

import { useDispatch, useSelector } from 'src/hooks/suite';

type UseTradingClearStaleQuotesProps = {
    type: TradingType;
    isAmountEmpty: boolean;
};

const clearQuotesActionByType = {
    buy: tradingBuyActions.clearQuotes,
    sell: tradingSellActions.clearQuotes,
    exchange: tradingExchangeActions.clearQuotes,
} satisfies Record<TradingType, unknown>;

export const useTradingClearStaleQuotes = ({
    type,
    isAmountEmpty,
}: UseTradingClearStaleQuotesProps) => {
    const dispatch = useDispatch();
    const hasQuotes = useSelector(state => selectTradingQuotesByType(state, type).length > 0);

    useEffect(() => {
        if (isAmountEmpty && hasQuotes) {
            dispatch(clearQuotesActionByType[type]());
        }
    }, [type, isAmountEmpty, hasQuotes, dispatch]);
};
