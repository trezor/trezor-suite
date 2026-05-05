import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useSelector } from './useSelector';
import { selectTradingDetailData } from '../selectors/tradingSelectors';
import { tradingThunks } from '../thunks/common';
import { type TradingType } from '../types';
import type {
    TradingTradeInfoMapProps,
    TradingTradeTransactionMapProps,
    TradingUseDetailOutputWithoutAccountProps,
    TradingUseDetailPropsWithoutAccount,
} from '../types/tradingDetail';

export const useTradingDetailData = <T extends TradingType>(
    tradeType: TradingType,
): TradingUseDetailOutputWithoutAccountProps<T> => {
    const { info, transactionId, trade } = useSelector(state =>
        selectTradingDetailData(state, tradeType),
    ) as {
        info: TradingTradeInfoMapProps[T] | undefined;
        transactionId: string | undefined;
        trade: TradingTradeTransactionMapProps[T] | undefined;
    };
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(tradingThunks.loadInitialDataThunk({ activeSection: tradeType }));
    }, [dispatch, tradeType]);

    return {
        trade,
        transactionId,
        info,
    };
};

export const useTradingDetail = <T extends TradingType>({
    tradeType,
}: TradingUseDetailPropsWithoutAccount): TradingUseDetailOutputWithoutAccountProps<T> => {
    const { info, transactionId, trade } = useTradingDetailData(tradeType);

    return {
        info: info as TradingTradeInfoMapProps[T] | undefined,
        transactionId,
        trade: trade as TradingTradeTransactionMapProps[T] | undefined,
    };
};
