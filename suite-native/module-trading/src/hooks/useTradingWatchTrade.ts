import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import {
    TradingTransaction,
    TradingTransactionBuy,
    TradingTransactionExchange,
    TradingTransactionSell,
    TradingType,
    tradingThunks,
} from '@suite-common/trading';
import { Account } from '@suite-common/wallet-types';

import { useReloadTimer } from './useReloadTimer';
import { tradeFinalStatuses } from '../utils/tradeUtils';

export type TradingTradeMapProps = {
    buy: TradingTransactionBuy;
    sell: TradingTransactionSell;
    exchange: TradingTransactionExchange;
};

export interface TradingUseWatchTradeProps<T extends TradingType> {
    account: Account | undefined;
    trade: TradingTradeMapProps[T] | undefined;
}
const REFRESH_SECONDS = 30;

export const shouldRefreshTrade = (trade: TradingTransaction | undefined) =>
    trade && trade.data.status && !tradeFinalStatuses[trade.tradeType].includes(trade.data.status);

export const useTradingWatchTrade = <T extends TradingType>({
    account,
    trade,
}: TradingUseWatchTradeProps<T>) => {
    const dispatch = useDispatch();
    const shouldRefresh = useMemo(() => shouldRefreshTrade(trade), [trade]);
    const { timer, shouldReload, resetCount } = useReloadTimer({
        isEnabled: shouldRefresh,
        refreshLimitSeconds: REFRESH_SECONDS,
    });
    const [hasRefreshed, setHasRefreshed] = useState(false);
    const { reset } = timer;

    useEffect(() => {
        if (trade && account && (!hasRefreshed || shouldReload) && shouldRefresh) {
            if (!hasRefreshed) {
                setHasRefreshed(true);
            }
            dispatch(
                tradingThunks.watchTradeThunk({
                    account,
                    trade,
                    refreshCount: resetCount,
                }),
            );
            reset();
        }
    }, [account, trade, resetCount, dispatch, shouldReload, reset, hasRefreshed, shouldRefresh]);
};
