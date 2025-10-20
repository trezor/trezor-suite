import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    TradingTransaction,
    TradingTransactionBuy,
    TradingTransactionExchange,
    TradingTransactionSell,
    selectTradingTradeByOrderId,
    tradeFinalStatuses,
    tradingThunks,
} from '@suite-common/trading';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { EventType, analytics } from '@suite-native/analytics';

import { useReloadTimer } from './useReloadTimer';
import { TradingRootState } from '../../reducers';
import { getTradeStatusStep } from '../../utils/general/utils';

export type TradingTradeMapProps = {
    buy: TradingTransactionBuy;
    sell: TradingTransactionSell;
    exchange: TradingTransactionExchange;
};

export interface TradingUseWatchTradeProps {
    accountKey: string | undefined;
    orderId: string | undefined;
    isInProgress: boolean;
}
const REFRESH_SECONDS_BASE = 30;
const REFRESH_SECONDS_IN_PROGRESS = 10;

export const shouldRefreshTrade = (trade: TradingTransaction | undefined) =>
    trade && trade.data.status && !tradeFinalStatuses[trade.tradeType].includes(trade.data.status);

export const useWatchTrade = ({ accountKey, orderId, isInProgress }: TradingUseWatchTradeProps) => {
    const dispatch = useDispatch();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );
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
