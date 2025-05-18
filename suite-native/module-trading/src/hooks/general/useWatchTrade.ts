import { useEffect, useMemo, useRef, useState } from 'react';
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
import { EventType, analytics } from '@suite-native/analytics';

import { useReloadTimer } from './useReloadTimer';
import { getTradeStatusStep, tradeFinalStatuses } from '../../utils/general/utils';

export type TradingTradeMapProps = {
    buy: TradingTransactionBuy;
    sell: TradingTransactionSell;
    exchange: TradingTransactionExchange;
};

export interface TradingUseWatchTradeProps<T extends TradingType> {
    account: Account | undefined;
    trade: TradingTradeMapProps[T] | undefined;
    isInProgress: boolean;
}
const REFRESH_SECONDS_BASE = 30;
const REFRESH_SECONDS_IN_PROGRESS = 10;

export const shouldRefreshTrade = (trade: TradingTransaction | undefined) =>
    trade && trade.data.status && !tradeFinalStatuses[trade.tradeType].includes(trade.data.status);

export const useWatchTrade = <T extends TradingType>({
    account,
    trade,
    isInProgress,
}: TradingUseWatchTradeProps<T>) => {
    const dispatch = useDispatch();
    const shouldRefresh = useMemo(() => shouldRefreshTrade(trade), [trade]);
    const { timer, shouldReload, resetCount } = useReloadTimer({
        isEnabled: shouldRefresh,
        refreshLimitSeconds: isInProgress ? REFRESH_SECONDS_IN_PROGRESS : REFRESH_SECONDS_BASE,
    });
    const [hasRefreshed, setHasRefreshed] = useState(false);
    const previousStatus = useRef<ReturnType<typeof getTradeStatusStep>>(undefined);
    const { reset } = timer;

    useEffect(() => {
        const currentStatus = getTradeStatusStep(trade);
        if (currentStatus !== previousStatus.current) {
            previousStatus.current = currentStatus;

            if (trade && currentStatus) {
                analytics.report({
                    type: EventType.TradingStatus,
                    payload: { type: trade.tradeType, status: currentStatus },
                });
            }
        }
    }, [trade, account, previousStatus]);

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
